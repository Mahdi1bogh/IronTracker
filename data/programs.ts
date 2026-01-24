
import { Program } from '../types';

export const DEFAULT_PROGRAMS: Program[] = [
  {
    "id": "prog_phul_final",
    "name": "PHUL (Power Hypertrophy)",
    "sessions": [
      {
        "id": "sess_j1",
        "name": "UPPER A (Power)",
        "exos": [
          // Power: On garde 2 reps en réserve pour la sécurité et la force nerveuse
          { "id": "dumbbell_bench_press", "sets": 4, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "pull_up", "sets": 4, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "dumbbell_seated_overhead_press", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "2" },
          { "id": "seated_dumbbell_row", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "2" },
          // Accessoires : On se rapproche de l'échec (RIR 1)
          { "id": "bar_dip", "sets": 3, "reps": "10-12", "rest": 120, "targetRir": "1" },
          { "id": "cable_pushdown", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "1" },
          { "id": "ez_bar_curl", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "barbell_wrist_curl", "sets": 3, "reps": "15-20", "rest": 60, "targetRir": "1" }
        ]
      },
      {
        "id": "sess_j2",
        "name": "LOWER A (Power)",
        "exos": [
          // Squat & RDL : RIR 2 impératif pour sécuriser les lombaires sur du lourd
          { "id": "barbell_squat", "sets": 4, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "romanian_deadlift", "sets": 4, "reps": "8-10", "rest": 150, "targetRir": "2" },
          // Presse et Isolation : RIR 1
          { "id": "leg_press", "sets": 3, "reps": "10-12", "rest": 120, "targetRir": "1" },
          { "id": "seated_leg_curl", "sets": 3, "reps": "12-15", "rest": 90, "targetRir": "1" },
          { "id": "standing_calf_raise", "sets": 4, "reps": "12-15", "rest": 60, "targetRir": "1" },
          { "id": "cable_woodchopper", "sets": 3, "reps": "15-20", "rest": 60, "targetRir": "1" }
        ]
      },
      {
        "id": "sess_j4",
        "name": "UPPER B (Hypertrophy)",
        "exos": [
          // Hypertrophie : On cherche l'intensité, RIR 1-2 sur le composé
          { "id": "incline_dumbbell_press", "sets": 4, "reps": "10-12", "rest": 120, "targetRir": "1" },
          { "id": "chin_up", "sets": 4, "reps": "10-12", "rest": 120, "targetRir": "1" },
          // Isolation pure : RIR 0 ou 1 (Echec technique)
          { "id": "pec_deck", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" },
          { "id": "cable_lateral_raise", "sets": 4, "reps": "15-20", "rest": 60, "targetRir": "0" },
          { "id": "face_pull", "sets": 3, "reps": "15-20", "rest": 60, "targetRir": "1" },
          { "id": "cable_overhead_triceps_extension", "sets": 3, "reps": "12-15", "rest": 90, "targetRir": "0" },
          { "id": "dumbbell_hammer_curl", "sets": 3, "reps": "12-15", "rest": 90, "targetRir": "1" },
          { "id": "sit_up", "sets": 3, "reps": "15-20", "rest": 60, "targetRir": "1" }
        ]
      },
      {
        "id": "sess_j5",
        "name": "LOWER B (Hypertrophy)",
        "exos": [
          // Split Squat : Exercice instable, RIR 2 pour la forme
          { "id": "dumbbell_bulgarian_split_squat", "sets": 4, "reps": "8-10", "rest": 120, "targetRir": "2" },
          { "id": "hip_thrust", "sets": 4, "reps": "10-12", "rest": 120, "targetRir": "1" },
          // Machines : RIR 0 (Echec musculaire safe)
          { "id": "leg_extension", "sets": 3, "reps": "12-15", "rest": 90, "targetRir": "0" },
          { "id": "lying_leg_curl", "sets": 3, "reps": "12-15", "rest": 90, "targetRir": "0" },
          { "id": "seated_calf_raise", "sets": 4, "reps": "15-20", "rest": 60, "targetRir": "0" },
          { "id": "hanging_leg_raise", "sets": 3, "reps": "MAX", "rest": 60, "targetRir": "1" },
          { "id": "barbell_wrist_curl", "sets": 3, "reps": "15-20", "rest": 60, "targetRir": "0" }
        ]
      }
    ]
  }
];
