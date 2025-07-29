import { FightService } from "../services/fightService.js"; // Ensure correct path and .js extension

export class FightController {
  #fightService;

  #io;

  constructor(io) {
    this.#io = io;
    this.#fightService = new FightService(this.#io);
  }

  getFightsByCategory = (req, res) => {
    const categoryId = req.params.id;

    try {
      const categoryFights = this.#fightService.getFightsByCategory(categoryId);
      res.status(200).render("fights", { matches: categoryFights });
    } catch (error) {
      console.error("Error getting fights by category:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  createFight = (req, res) => {
    console.log("creaating fight");
    const fightData = req.body;

    try {
      this.#fightService.createFight(fightData);
      res.status(200).send("Fight created successfully");
    } catch (error) {
      console.error("Error creating fight:", error);
      res.status(500).send("Internal Server Error");
    }
    console.log("fight added");
  };

  updateFightPoints = (req, res) => {
    const fight_id = req.params.id;
    const { corner, points } = req.body;

    if (!fight_id || !points || !corner) {
      return res.status(400).send(
        "Missing ring, points, or corner in request.",
      );
    }

    try {
      const updated = this.#fightService.updateFightPoints(
        fight_id,
        corner,
        points,
      );
      if (updated) {
        res.status(200).send("Points updated successfully");
      } else {
        res.status(404).send("Fight not found or points could not be updated.");
      }
    } catch (error) {
      console.error("Error updating fight points:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  getFightById = (req, res) => {
    const fightId = req.params.id;

    if (!fightId) {
      return res.status(400).send("Missing fight ID parameter.");
    }

    try {
      const match = this.#fightService.getFightById(fightId);
      if (match) {
        res.render("match", { match: match });
      } else {
        res.status(404).send(`Match with ID ${fightId} not found.`);
      }
    } catch (error) {
      console.error("Error getting fight by ID:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  createCornerResult = (req, res) => {
    console.log("creating corner result");
    const cornerData = req.body;

    try {
      this.#fightService.createCornerResult(cornerData);
      res.status(200).send("Corner result created successfully");
    } catch (error) {
      console.error("Error creating corner result:", error);
      res.status(500).send("Internal Server Error");
    }

    console.log("corner result added");
  };

  getAthleteFights = (req, res) => {
    const athleteId = req.params.id;

    try {
      const athleteFights = this.#fightService.getAthleteFights(athleteId);
      res.status(200).send(athleteFights);
    } catch (error) {
      console.error("Error getting fights by athlete:", error);
      res.status(500).send("Internal Server Error");
    }
  };
}
