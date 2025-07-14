// modules/routes/tournaments.js
import { Router } from "express";
import { TournamentController } from "../controllers/tournamentController.js"; // Ensure correct path and .js extension

/**
 * Initializes and returns the tournaments router.
 * @returns {Router} The Express router for tournament-related routes.
 */
export const tournamentsRouter = () => {
  // Instantiate the TournamentController
  const tournamentController = new TournamentController();
  const router = Router();

  // Route to get all tournaments
  // GET /tournaments/
  router.get("/", tournamentController.getAllTournaments);

  // Route to create a new tournament
  // POST /tournaments/
  router.post("/", tournamentController.createTournament);

  // Route to get categories for a specific tournament
  // GET /tournaments/:id/categories
  router.get("/:id/categories", tournamentController.getTournamentCategories);

  // Route to create a new category
  // POST /tournaments/categories
  router.post("/categories", tournamentController.createCategory);

  return router;
};

