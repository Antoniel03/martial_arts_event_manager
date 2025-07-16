export class TournamentService {
  #tournaments = [];

  #categories = [];

  constructor() {
    this.#tournaments = [];
    this.#categories = [];
  }

  getAllTournaments() {
    return this.#tournaments;
  }

  createTournament(tournamentData) {
    this.#tournaments.push(tournamentData);
    console.log("New tournament added:", tournamentData);
    return tournamentData;
  }

  getCategoriesByTournamentId(tournamentId) {
    return this.#categories.filter((category) =>
      category.tournament_id === tournamentId
    );
  }

  createCategory(categoryData) {
    this.#categories.push(categoryData);
    console.log("New category added:", categoryData);
    return categoryData;
  }
}
