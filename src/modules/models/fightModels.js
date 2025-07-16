export interface Fight {
  id: string;             // Unique ID for the fight.
  category_id: string;    // The ID of the category this fight belongs to.
  ring: string;           // The ring number where the fight is taking place.
  athlete_red: string;    // Name of the athlete in the red corner.
  athlete_blue: string;   // Name of the athlete in the blue corner.
  points_red: string;     // Points scored by the athlete in the red corner (string as per your log).
  points_blue: string;    // Points scored by the athlete in the blue corner (string as per your log).
  status: 'in progress' | 'completed' | 'scheduled' | 'cancelled'; // Current status of the fight.
  winner: string;         // Name of the winner, or 'nd' if not determined yet.
}
