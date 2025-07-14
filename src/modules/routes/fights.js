import { Router } from "express";
import { FightController } from "../controllers/fightController.js";
// import { fightService } from "../services/fightService";
// import { fightRepository } from "../repositories/fightRepository";

export const fightsRouter = (io) => {
  // Instantiate the FightController, passing the Socket.IO instance
  const fightController = new FightController(io);
  const router = Router();

  // Route to get fights by category ID
  // GET /fights/categories/:id
  router.get("/categories/:id", fightController.getFightsByCategory);

  // Route to create a new fight
  // POST /fights
  router.post("/", fightController.createFight);

  // Route to update points for a fight
  // PUT /fights/point
  router.put("/point", fightController.updateFightPoints);

  // Route to get a single match by ring number
  // GET /fights/match
  router.get("/match/:id", fightController.getFightById);

  return router;
};
