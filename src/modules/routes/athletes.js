import { Router } from "express";
export const athletesRouter = Router();

let athletes = [];

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

athletesRouter.get("/:id", (req, res) => {
  const id = Object.values(req.params)[0];
  const athlete = get_athlete_by_id(id);
  res.status(200).render("athletes", { athlete: athlete });
  // console.log(athlete);
});

athletesRouter.post("/", (req, res) => {
  // console.log(req.body);
  const athlete = req.body;
  athletes.push(athlete);

  res.status(200).send("ok");
});
