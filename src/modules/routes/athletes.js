import { Router } from "express";
import { matches } from "../services/fightService.js";
import { cornerResults } from "../services/fightService.js";

export const athletesRouter = Router();

export let athletes = [];
export let athleteStats = [];

export function get_athlete_by_id(id) {
  for (let i = 0; i < athletes.length; i++) {
    if (athletes[i].id === id) {
      return athletes[i];
    }
  }
  return undefined;
}

athletesRouter.get("/", (req, res) => {
  res.status(200).render("athletes_list", { athletes: athletes });
});

athletesRouter.get("/api", (req, res) => {
  res.status(200).send(athletes);
});

athletesRouter.get("/register", (req, res) => {
  res.status(200).render("athletes_registration", { athletes: athletes });
});

function getAthleteFights(athleteId) {
  const cornerData = cornerResults.filter((corner) =>
    corner.fighter_id === athleteId
  );
  let results = [];
  cornerData.forEach((corner) => {
    const matchesByCorner = matches.filter((match) =>
      match.id === corner.fight_id
    );
    results = results.concat(matchesByCorner);
  });

  return results;
}
function createStats(fighter_id) {
  const stat = {
    id: "",
    fighter_id: fighter_id,
    strikes: undefined,
    body_part_strikes: undefined,
    win_gap: 0.0,
    win_rate: 0,
    record: [0, 0],
  };
  athleteStats.push(stat);
  return stat;
}

export function getAthleteStats(id) {
  return athleteStats.find((stats) => stats.fighter_id == id);
}

athletesRouter.get("/analytics", async (req, res) => {
  const comparison = compareAthletes(
    req.query.athlete1,
    req.query.athlete2,
    athletes,
    cornerResults,
    matches,
    athleteStats,
  );

  res.status(200).render("analytics", { comparison: comparison });
});

athletesRouter.get("/:id", async (req, res) => {
  const id = Object.values(req.params)[0];
  const fights = getAthleteFights(id);
  const stats = getAthleteStats(id);

  const athlete = get_athlete_by_id(id);
  res.status(200).render("athletes", {
    athlete: athlete,
    stats: stats,
    fights: fights,
  });
  // console.log(athlete);
});

athletesRouter.post("/", (req, res) => {
  console.log("athlete added:\n", req.body);
  const athlete = req.body;
  athletes.push(athlete);
  const stat = createStats(athlete.id);
  // console.log("stats saved: ", stat);

  res.status(200).send("ok");
});

function compareAthletes(
  athleteId1,
  athleteId2,
  athletesData,
  cornerResultsData,
  matchesData,
  athleteStatsData,
) {
  // --- 1. Retrieve Athlete Profiles ---
  const athlete1 = athletes.find((a) => a.id === athleteId1);
  const athlete2 = athletesData.find((a) => a.id === athleteId2);

  if (!athlete1 || !athlete2) {
    return { error: "One or both athletes not found in the 'athletes' data." };
  }

  // --- 2. Retrieve Stats Objects ---
  // These might be undefined if an athlete has no recorded stats
  const stats1 = athleteStatsData.find((s) => s.fighter_id === athleteId1);
  const stats2 = athleteStatsData.find((s) => s.fighter_id === athleteId2);

  // --- 3. Retrieve Corner Results for Each Athlete ---
  const athlete1CornerResults = cornerResultsData.filter((cr) =>
    cr.fighter_id === athleteId1
  );
  const athlete2CornerResults = cornerResultsData.filter((cr) =>
    cr.fighter_id === athleteId2
  );

  // --- 4. Retrieve Matches Involving Each Athlete ---
  const athlete1Matches = matchesData.filter((m) =>
    m.athlete_red_id === athleteId1 || m.athlete_blue_id === athleteId1
  );
  const athlete2Matches = matchesData.filter((m) =>
    m.athlete_red_id === athleteId2 || m.athlete_blue_id === athlete2
  );

  // --- Helper Functions for Calculations ---

  /**
   * Calculates the total number of valid fouls (non-empty strings) for an athlete.
   * @param {Array<Object>} results - Array of corner result objects for an athlete.
   * @returns {number} Total foul count.
   */
  const calculateTotalFouls = (results) => {
    return results.reduce(
      (sum, cr) =>
        sum + cr.fouls.filter((foul) => foul && foul.trim() !== "").length,
      0,
    );
  };

  /**
   * Determines the most used striking technique based on percentages.
   * @param {Object} strikes - The strikes object from athleteStats.
   * @returns {string} Formatted string of the most used technique and its percentage, or 'N/A'.
   */
  const getMostUsedTechnique = (strikes) => {
    if (!strikes || Object.keys(strikes).length === 0) {
      return "N/A";
    }

    let mostUsed = "";
    let maxPercentage = -1;

    for (const technique in strikes) {
      if (strikes.hasOwnProperty(technique)) { // Ensure it's an own property
        if (strikes[technique] > maxPercentage) {
          maxPercentage = strikes[technique];
          mostUsed = technique;
        }
      }
    }
    return `${mostUsed} (${maxPercentage.toFixed(1)}%)`;
  };

  /**
   * Determines the preferred body part for strikes (Head vs. Body).
   * @param {Object} bodyPartStrikes - The body_part_strikes object from athleteStats.
   * @returns {string} Formatted string of the preferred body part and its percentage, or 'N/A'.
   */
  const getPreferredBodyPart = (bodyPartStrikes) => {
    if (
      !bodyPartStrikes ||
      (bodyPartStrikes.head === undefined && bodyPartStrikes.body === undefined)
    ) {
      return "N/A";
    }

    const headPercentage = bodyPartStrikes.head || 0;
    const bodyPercentage = bodyPartStrikes.body || 0;

    if (headPercentage > bodyPercentage) {
      return `Cabeza (${headPercentage.toFixed(1)}%)`;
    } else if (bodyPercentage > headPercentage) {
      return `Cuerpo (${bodyPercentage.toFixed(1)}%)`;
    } else if (headPercentage > 0 || bodyPercentage > 0) { // If both are equal and not zero
      return `Igual (Cabeza: ${headPercentage.toFixed(1)}%, Cuerpo: ${bodyPercentage.toFixed(1)
        }%)`;
    }
    return "N/A";
  };

  /**
   * Identifies the striking technique most frequently used by opponents against the target athlete
   * in matches that the target athlete lost.
   * @param {string} targetAthleteId - The ID of the athlete whose weaknesses are being analyzed.
   * @param {Array<Object>} matchesData - Array of match objects.
   * @param {Array<Object>} cornerResultsData - Array of corner results objects.
   * @returns {string} The technique most frequently used by opponents in losses, or 'N/A'.
   */
  const getTechniqueWeakAgainst = (
    targetAthleteId,
    matchesData,
    cornerResultsData,
  ) => {
    const opponentTechniqueCounts = {}; // { 'TechniqueName': count }

    // Filter matches where the targetAthleteId was the loser
    const losingMatches = matchesData.filter((match) => {
      const isTargetRed = match.athlete_red_id === targetAthleteId;
      const isTargetBlue = match.athlete_blue_id === targetAthleteId;

      // Check if the target athlete was the loser (opponent explicitly won, not a draw)
      if (isTargetRed && match.winner === match.athlete_blue_id) {
        return true;
      }
      if (isTargetBlue && match.winner === match.athlete_red_id) {
        return true;
      }
      return false;
    });

    losingMatches.forEach((losingMatch) => {
      const opponentId = (losingMatch.athlete_red_id === targetAthleteId)
        ? losingMatch.athlete_blue_id
        : losingMatch.athlete_red_id;
      const fightId = losingMatch.id;

      // Find the corner result for the opponent in this specific losing fight
      const opponentCornerResult = cornerResultsData.find((cr) =>
        cr.fighter_id === opponentId && cr.fight_id === fightId
      );

      if (opponentCornerResult && opponentCornerResult.strikes_landed) {
        opponentCornerResult.strikes_landed.forEach((strike) => {
          const technique = strike[0]; // The technique name is the first element
          if (technique && technique.trim() !== "") {
            opponentTechniqueCounts[technique] =
              (opponentTechniqueCounts[technique] || 0) + 1;
          }
        });
      }
    });

    // Find the technique with the highest count
    let mostFrequentTechnique = "N/A";
    let maxCount = 0;

    for (const technique in opponentTechniqueCounts) {
      if (opponentTechniqueCounts.hasOwnProperty(technique)) {
        if (opponentTechniqueCounts[technique] > maxCount) {
          maxCount = opponentTechniqueCounts[technique];
          mostFrequentTechnique = technique;
        }
      }
    }

    // If a technique was found, format it with its count
    return maxCount > 0
      ? `${mostFrequentTechnique} (usada ${maxCount} veces por oponentes en derrotas)`
      : "N/A (no se encontró debilidad clara basada en derrotas)";
  };

  // --- Calculate Head-to-Head Record ---
  let headToHeadRecord = {
    fights: 0,
    athlete1Wins: 0,
    athlete2Wins: 0,
    draws: 0,
  };

  matchesData.forEach((match) => {
    const isAthlete1RedAndAthlete2Blue = match.athlete_red_id === athleteId1 &&
      match.athlete_blue_id === athleteId2;
    const isAthlete2RedAndAthlete1Blue = match.athlete_red_id === athleteId2 &&
      match.athlete_blue_id === athlete1;

    if (isAthlete1RedAndAthlete2Blue || isAthlete2RedAndAthlete1Blue) {
      headToHeadRecord.fights++;
      if (match.winner === athleteId1) {
        headToHeadRecord.athlete1Wins++;
      } else if (match.winner === athleteId2) {
        headToHeadRecord.athlete2Wins++;
      } else if (
        match.winner === "nd" || (match.status === "Terminado" && !match.winner)
      ) { // 'nd' for no decision, or concluded without explicit winner
        headToHeadRecord.draws++;
      }
    }
  });

  // --- Construct the Comparison Object ---
  const comparison = {
    athlete1: {
      id: athlete1.id,
      name: `${athlete1.name} ${athlete1.lastname}`,
      team: athlete1.team || "N/A",
      fightingStyle: athlete1.fighting_style || "N/A",
      rank: athlete1.rank || "N/A",
      weight: athlete1.weight ? `${athlete1.weight} kg` : "N/A",
      record: stats1 ? `${stats1.record[0]} - ${stats1.record[1]}` : "N/A",
      winRate: stats1 ? `${stats1.win_rate.toFixed(2)}%` : "N/A",
      winGap: stats1 ? `${stats1.win_gap.toFixed(2)}%` : "N/A",
      mostUsedTechnique: getMostUsedTechnique(stats1 ? stats1.strikes : null),
      preferredBodyPart: getPreferredBodyPart(
        stats1 ? stats1.body_part_strikes : null,
      ),
      totalFights: athlete1Matches.length,
      totalFouls: calculateTotalFouls(athlete1CornerResults),
      // NEW METRIC
      techniqueWeakAgainst: getTechniqueWeakAgainst(
        athleteId1,
        matchesData,
        cornerResultsData,
      ),
    },
    athlete2: {
      id: athlete2.id,
      name: `${athlete2.name} ${athlete2.lastname}`,
      team: athlete2.team || "N/A",
      fightingStyle: athlete2.fighting_style || "N/A",
      rank: athlete2.rank || "N/A",
      weight: athlete2.weight ? `${athlete2.weight} kg` : "N/A",
      record: stats2 ? `${stats2.record[0]} - ${stats2.record[1]}` : "N/A",
      winRate: stats2 ? `${stats2.win_rate.toFixed(2)}%` : "N/A",
      winGap: stats2 ? `${stats2.win_gap.toFixed(2)}%` : "N/A",
      mostUsedTechnique: getMostUsedTechnique(stats2 ? stats2.strikes : null),
      preferredBodyPart: getPreferredBodyPart(
        stats2 ? stats2.body_part_strikes : null,
      ),
      totalFights: athlete2Matches.length,
      totalFouls: calculateTotalFouls(athlete2CornerResults),
      // NEW METRIC
      techniqueWeakAgainst: getTechniqueWeakAgainst(
        athleteId2,
        matchesData,
        cornerResultsData,
      ),
    },
    headToHead: headToHeadRecord,
  };

  return comparison;
}
