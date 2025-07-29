import { TournamentService } from "../services/tournamentService.js"; // Ensure correct path and .js extension

export class TournamentController {
  #tournamentService;

  constructor() {
    this.#tournamentService = new TournamentService();
  }

  sendAllTournaments = (req, res) => {
    try {
      const tournaments = this.#tournamentService.getAllTournaments();
      res.status(200).send(tournaments);
    } catch (error) {
      console.error("Error getting all tournaments:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  getAllTournaments = (req, res) => {
    try {
      const tournaments = this.#tournamentService.getAllTournaments();
      res.status(200).render("tournaments", { tournaments: tournaments });
    } catch (error) {
      console.error("Error getting all tournaments:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  sendTournamentCategories = (req, res) => {
    const tournamentId = req.params.id;

    if (!tournamentId) {
      return res.status(400).send("Missing tournament ID parameter.");
    }
    try {
      const tournamentCategories = this.#tournamentService
        .getCategoriesByTournamentId(tournamentId);
      res.status(200).send(tournamentCategories);
    } catch (error) {
      console.error("Error getting tournament categories:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  registerTournament = (req, res) => {
    try {
      // const tournaments = this.#tournamentService.getAllTournaments();
      res.status(200).render("create_tournament");
    } catch (error) {
      console.error("Error while rendering tournaments", error);
      res.status(500).send("Internal Server Error");
    }
  };

  registerCategory = (req, res) => {
    try {
      const tournaments = this.#tournamentService.getAllTournaments();
      res.status(200).render("create_category", { tournaments: tournaments });
    } catch (error) {
      console.error("Error while rendering categories", error);
      res.status(500).send("Internal Server Error");
    }
  };

  createTournament = (req, res) => {
    console.log("POST /tournaments route hit!");
    console.log("Request body:", req.body);

    const tournamentData = req.body;

    if (!tournamentData || Object.keys(tournamentData).length === 0) {
      console.warn("Received empty or invalid tournament data for creation.");
      return res.status(400).send(
        "Bad Request: Tournament data is missing or empty.",
      );
    }

    try {
      this.#tournamentService.createTournament(tournamentData);
      res.status(200).send("Tournament created successfully");
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  getTournamentCategories = (req, res) => {
    const tournamentId = req.params.id;

    if (!tournamentId) {
      return res.status(400).send("Missing tournament ID parameter.");
    }

    try {
      const tournamentCategories = this.#tournamentService
        .getCategoriesByTournamentId(tournamentId);
      res.status(200).render("tournament_categories", {
        categories: tournamentCategories,
      });
      console.log("Rendering categories for tournament:", tournamentId);
    } catch (error) {
      console.error("Error getting tournament categories:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  createCategory = (req, res) => {
    const categoryData = req.body;

    if (!categoryData || Object.keys(categoryData).length === 0) {
      console.warn("Received empty or invalid category data for creation.");
      return res.status(400).send(
        "Bad Request: Category data is missing or empty.",
      );
    }

    try {
      this.#tournamentService.createCategory(categoryData);
      res.status(200).send("Category created successfully");
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).send("Internal Server Error");
    }
  };
}
