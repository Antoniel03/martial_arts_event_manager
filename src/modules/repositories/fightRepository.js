export class FightRepository {
  constructor(db) {
    this.db = db;
  }

  async getFightsByCategory(categoryId) {
    const query = `
      SELECT 
        f.id, f.ring, f.duration, f.winner, f.judge, f.date,
        cr_red.total_score AS points_red,
        cr_blue.total_score AS points_blue,
        a_red.id AS red_athlete_id, 
        a_red.name AS red_name, 
        a_red.lastname AS red_lastname,
        a_blue.id AS blue_athlete_id,
        a_blue.name AS blue_name,
        a_blue.lastname AS blue_lastname
      FROM category_fights cf
      JOIN fight f ON cf.fight_id = f.id
      JOIN corner_result cr_red ON f.red_corner_id = cr_red.id
      JOIN athlete a_red ON cr_red.athlete_id = a_red.id
      JOIN corner_result cr_blue ON f.blue_corner_id = cr_blue.id
      JOIN athlete a_blue ON cr_blue.athlete_id = a_blue.id
      WHERE cf.category_id = ?
    `;
    return this.db.all(query, [categoryId]);
  }

  async createFight(fightData) {
    const { red_athlete_id, blue_athlete_id, ring, category_id } = fightData;

    return this.db.transaction(async () => {
      // Create corner results
      const redCorner = await this.db.run(
        `INSERT INTO corner_result (athlete_id, fouls, point_reduction_total, total_score)
         VALUES (?, '', 0, 0)`,
        [red_athlete_id],
      );

      const blueCorner = await this.db.run(
        `INSERT INTO corner_result (athlete_id, fouls, point_reduction_total, total_score)
         VALUES (?, '', 0, 0)`,
        [blue_athlete_id],
      );

      // Create fight
      const fight = await this.db.run(
        `INSERT INTO fight (red_corner_id, blue_corner_id, ring, duration, winner, judge, date)
         VALUES (?, ?, ?, NULL, NULL, NULL, CURRENT_TIMESTAMP)`,
        [redCorner.lastID, blueCorner.lastID, ring],
      );

      // Link to category
      await this.db.run(
        `INSERT INTO category_fights (fight_id, category_id, started_at, ended_at)
         VALUES (?, ?, CURRENT_TIMESTAMP, NULL)`,
        [fight.lastID, category_id],
      );

      return {
        id: fight.lastID,
        ring,
        red_athlete_id,
        blue_athlete_id,
        category_id,
      };
    });
  }

  async updateCornerPoints(ring, corner, points) {
    const cornerType = corner === "red" ? "red_corner_id" : "blue_corner_id";

    const query = `
      UPDATE corner_result
      SET total_score = total_score + ?
      WHERE id = (
        SELECT ${cornerType}
        FROM fight
        WHERE ring = ?
      )
      RETURNING total_score;
    `;

    const result = await this.db.get(query, [points, ring]);
    return result?.total_score;
  }

  async getFightById(id) {
    const query = `
      SELECT 
        f.id, f.ring, f.duration, f.winner, f.judge, f.date,
        cr_red.total_score AS points_red,
        cr_blue.total_score AS points_blue,
        a_red.id AS red_athlete_id, 
        a_red.name AS red_name, 
        a_red.lastname AS red_lastname,
        a_blue.id AS blue_athlete_id,
        a_blue.name AS blue_name,
        a_blue.lastname AS blue_lastname
      FROM fight f
      JOIN corner_result cr_red ON f.red_corner_id = cr_red.id
      JOIN athlete a_red ON cr_red.athlete_id = a_red.id
      JOIN corner_result cr_blue ON f.blue_corner_id = cr_blue.id
      JOIN athlete a_blue ON cr_blue.athlete_id = a_blue.id
      WHERE f.id = ?
    `;
    return this.db.get(query, [id]);
  }
}

