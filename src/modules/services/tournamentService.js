export class TournamentService {
  #tournaments = [];

  #categories = [];

  constructor() {
    this.#tournaments = [
      { id: "t1", name: "Summer Slam 2024", date: "2024-08-15" },
      { id: "t2", name: "Winter Cup 2024", date: "2024-12-01" },
    ];
    this.#categories = [
      { id: "c1", tournament_id: "t1", name: "Men's Lightweight" },
      { id: "c2", tournament_id: "t1", name: "Women's Welterweight" },
      { id: "c3", tournament_id: "t2", name: "Junior Flyweight" },
    ];
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
