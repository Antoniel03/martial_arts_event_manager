import { getAthleteStats } from "../routes/athletes.js"; // Ensure correct path and .js extension
import { athleteStats } from "../routes/athletes.js"; // Ensure correct path and .js extension
import { get_athlete_by_id } from "../routes/athletes.js"; // Ensure correct path and .js extension

export let matches = [];
export let cornerResults = [];

export class FightService {
  #io;

  constructor(io) {
    this.#io = io;
  }

  getAverageStrikesByBodyPart(fighterId) {
    let totalBodyStrikes = 0;
    let totalHeadStrikes = 0;

    const fighterFights = cornerResults.filter((fight) =>
      fight.fighter_id === fighterId
    );

    fighterFights.forEach((fight) => {
      fight.strikes_landed.forEach((strike) => {
        const targetBodyPart = strike[1];

        if (targetBodyPart === "Cuerpo") {
          totalBodyStrikes++;
        } else if (targetBodyPart === "Cabeza") {
          totalHeadStrikes++;
        }
      });
    });

    const totalStrikesToBodyAndHead = totalBodyStrikes + totalHeadStrikes;

    let percentageBody = 0.00;
    let percentageHead = 0.00;

    if (totalStrikesToBodyAndHead > 0) {
      percentageBody = parseFloat(
        ((totalBodyStrikes / totalStrikesToBodyAndHead) * 100).toFixed(2),
      );
      percentageHead = parseFloat((100 - percentageBody).toFixed(2));
    }

    return {
      body: percentageBody,
      head: percentageHead,
    };
  }

  calculateAverageScoreGap(fighterId, fightDataArray) {
    let totalScoreGap = 0;
    let winsCounted = 0;

    const fighterFights = fightDataArray.filter((fight) =>
      fight.fighter_id === fighterId
    );

    fighterFights.forEach((fighterFight) => {
      if (fighterFight.result === "Ganador") {
        const opponentFight = fightDataArray.find(
          (fight) =>
            fight.fight_id === fighterFight.fight_id &&
            fight.fighter_id !== fighterId,
        );

        if (opponentFight) {
          const scoreGap = fighterFight.score - opponentFight.score;
          totalScoreGap += scoreGap;
          winsCounted++;
        } else {
          console.warn(
            `Opponent data not found for fighter ${fighterId} in winning fight ${fighterFight.fight_id}. This fight will be skipped for score gap calculation.`,
          );
        }
      }
    });

    if (winsCounted === 0) {
      return 0;
    } else {
      const averageGap = totalScoreGap / winsCounted;
      return parseFloat(averageGap.toFixed(2)); // Round the average gap to two decimal places
    }
  }

  #getFightByRing(matchesArray, ring) {
    return matchesArray.find((match) => match.ring == ring);
  }

  #getFightIndex(matchesArray, id) {
    return matchesArray.findIndex((match) => match.id == id);
  }

  getFightsByCategory(categoryId) {
    return matches.filter((match) => match.category_id === categoryId);
  }

  createFight(fightData) {
    matches.push(fightData);
    // console.log("New fight added:", fightData);
    return fightData;
  }

  analyzeFighterStrikes(fightData, fighterId) {
    const allFighterStrikesArrays = this.getAllStrikesForFighter(
      fightData,
      fighterId,
    );
    const flattenedStrikes = allFighterStrikesArrays.flat(1); // flat(1) flattens one level deep.
    const strikeTypesOnly = flattenedStrikes.map((strike) => strike[0]);
    const strikeAverages = this.calculateStrikeTypePercentages(strikeTypesOnly);

    return strikeAverages;
  }

  getAllStrikesForFighter(data, fighterId) {
    const fighterFights = data.filter((fight) =>
      fight.fighter_id === fighterId
    );
    const allStrikes = fighterFights.map((fight) => fight.strikes_landed);
    return allStrikes;
  }

  calculateStrikeTypePercentages(strikeTypes) {
    const strikeCounts = {};
    let totalStrikes = 0;

    for (const type of strikeTypes) {
      strikeCounts[type] = (strikeCounts[type] || 0) + 1;
      totalStrikes++;
    }

    const strikePercentages = {};

    if (totalStrikes === 0) {
      return {};
    }

    for (const type in strikeCounts) {
      strikePercentages[type] = (strikeCounts[type] / totalStrikes) * 100;
    }

    return strikePercentages;
  }

  updateRecord(index, result) {
    if (result === "Ganador") {
      athleteStats[index].record[0]++;
    } else {
      athleteStats[index].record[1]++;
    }
  }

  updateWinRate(record) {
    return (record[0] / (record[0] + record[1])) * 100;
  }

  updateStats(fighterId, result) {
    const updatedStats = this.analyzeFighterStrikes(
      cornerResults,
      fighterId,
    );

    for (let i = 0; i < athleteStats.length; i++) {
      if (athleteStats[i].fighter_id === fighterId) {
        // console.log("actual stats:\n", athleteStats[i]);
        athleteStats[i].strikes = updatedStats;
        this.updateRecord(i, result);
        athleteStats[i].win_rate = this.updateWinRate(athleteStats[i].record);
        athleteStats[i].win_gap = this.calculateAverageScoreGap(
          fighterId,
          cornerResults,
        );
        athleteStats[i].body_part_strikes = this.getAverageStrikesByBodyPart(
          fighterId,
        );

        // console.log("updated:\n", athleteStats[i]);
      }
    }
  }

  createCornerResult(cornerData) {
    cornerResults.push(cornerData.red);
    cornerResults.push(cornerData.blue);
    // console.log("New corner result added:", cornerData);
    this.updateStats(cornerData.red.fighter_id, cornerData.red.result);
    this.updateStats(cornerData.blue.fighter_id, cornerData.blue.result);
    return cornerData;
  }

  updateFightPoints(id, corner, points, fouls) {
    const index = this.#getFightIndex(matches, id);

    if (index === -1) {
      console.warn(`Fight with id ${id} not found for point update.`);
      return false;
    }

    const fight = matches[index];
    let updatedPoints;
    let headerId;

    if (corner === "red") {
      fight.points_red = (fight.points_red || 0) + points;
      updatedPoints = fight.points_red;
      headerId = "points_red";
    } else if (corner === "blue") {
      fight.points_blue = (fight.points_blue || 0) + points;
      updatedPoints = fight.points_blue;
      headerId = "points_blue";
    } else {
      console.warn(`Invalid corner specified: ${corner}`);
      return false;
    }

    if (this.#io) {
      this.#io.emit("msg", {
        header_id: headerId,
        points: updatedPoints,
        id: id,
        // ring: fight.ring,
      });
      console.log(
        `Emitted Socket.IO update for fight id ${id}, corner ${corner}: ${updatedPoints} points`,
      );
    } else {
      console.warn(
        "Socket.IO instance not available in FightService. Cannot emit message.",
      );
    }

    return true;
  }

  #getFightById(matchesArray, id) {
    return matchesArray.find((match) => match.id === id);
  }

  getFightById(id) {
    return this.#getFightById(matches, id);
  }
  getAthleteFights(athleteId) {
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
}
