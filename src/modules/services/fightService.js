export class FightService {
  #matches = [];

  #io;

  constructor(io) {
    this.#io = io;
    this.#matches = [];
  }

  #getFightByRing(matchesArray, ring) {
    return matchesArray.find((match) => match.ring == ring);
  }

  #getFightIndex(matchesArray, ring) {
    return matchesArray.findIndex((match) => match.ring == ring);
  }

  getFightsByCategory(categoryId) {
    return this.#matches.filter((match) => match.category_id === categoryId);
  }

  createFight(fightData) {
    this.#matches.push(fightData);
    console.log("New fight added:", fightData);
    return fightData;
  }

  updateFightPoints(ring, corner, points) {
    const index = this.#getFightIndex(this.#matches, ring);

    if (index === -1) {
      console.warn(`Fight with ring ${ring} not found for point update.`);
      return false;
    }

    const fight = this.#matches[index];
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
        ring: fight.ring,
      });
      console.log(
        `Emitted Socket.IO update for ring ${ring}, corner ${corner}: ${updatedPoints} points`,
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
    return this.#getFightById(this.#matches, id);
  }
}
