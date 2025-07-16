import { Router } from "express";
import { matches } from "../services/fightService.js";
import { cornerResults } from "../services/fightService.js";

export const athletesRouter = Router();

export let athletes = [];
export let athleteStats = [];

function get_athlete_by_id(id) {
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
  console.log("stats saved: ", stat);

  res.status(200).send("ok");
});
