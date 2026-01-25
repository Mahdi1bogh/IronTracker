
import { Program } from '../types';

export const DEFAULT_PROGRAMS: Program[] = [
  {
    "id": "prog_full_body",
    "name": "Full Body (Débutant - 3j)",
    "sessions": [
      {
        "id": "fb_a", "name": "Séance A",
        "exos": [
          { "id": "barbell_squat", "sets": 3, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "barbell_bench_press", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "2" },
          { "id": "seated_cable_row", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "dumbbell_shoulder_press", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "barbell_curl", "sets": 3, "reps": "10-12", "rest": 60, "targetRir": "0" }
        ]
      },
      {
        "id": "fb_b", "name": "Séance B",
        "exos": [
          { "id": "romanian_deadlift", "sets": 3, "reps": "8-10", "rest": 180, "targetRir": "2" },
          { "id": "barbell_overhead_press", "sets": 3, "reps": "6-8", "rest": 120, "targetRir": "2" },
          { "id": "lat_pulldown", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "leg_press", "sets": 3, "reps": "10-12", "rest": 120, "targetRir": "1" },
          { "id": "plank", "sets": 3, "reps": "45", "rest": 60, "targetRir": "0" }
        ]
      },
       {
        "id": "fb_c", "name": "Séance C",
        "exos": [
          { "id": "dumbbell_lunge", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "dumbbell_bench_press", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "1" },
          { "id": "barbell_bent_over_row", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "2" },
          { "id": "dumbbell_lateral_raise", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" },
          { "id": "lying_leg_curl", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" }
        ]
      }
    ]
  },
  {
    "id": "prog_upper_lower",
    "name": "Upper / Lower (Intermédiaire - 4j)",
    "sessions": [
      {
        "id": "ul_upper1", "name": "Upper A (Force)",
        "exos": [
          { "id": "barbell_bench_press", "sets": 4, "reps": "5-6", "rest": 180, "targetRir": "2" },
          { "id": "barbell_bent_over_row", "sets": 4, "reps": "6-8", "rest": 150, "targetRir": "2" },
          { "id": "barbell_overhead_press", "sets": 3, "reps": "6-8", "rest": 120, "targetRir": "1" },
          { "id": "bar_dip", "sets": 3, "reps": "8-10", "rest": 90, "targetRir": "1" },
          { "id": "barbell_curl", "sets": 3, "reps": "8-10", "rest": 90, "targetRir": "1" }
        ]
      },
      {
        "id": "ul_lower1", "name": "Lower A (Force)",
        "exos": [
          { "id": "barbell_squat", "sets": 4, "reps": "5-6", "rest": 180, "targetRir": "2" },
          { "id": "romanian_deadlift", "sets": 3, "reps": "6-8", "rest": 150, "targetRir": "2" },
          { "id": "leg_press", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "1" },
          { "id": "lying_leg_curl", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "0" },
          { "id": "standing_calf_raise", "sets": 4, "reps": "10-12", "rest": 60, "targetRir": "1" }
        ]
      },
      {
        "id": "ul_upper2", "name": "Upper B (Hypertrophie)",
        "exos": [
          { "id": "dumbbell_bench_press", "sets": 3, "reps": "8-12", "rest": 120, "targetRir": "1" },
          { "id": "lat_pulldown", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "dumbbell_shoulder_press", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "dumbbell_lateral_raise", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" },
          { "id": "cable_pushdown", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" }
        ]
      },
      {
        "id": "ul_lower2", "name": "Lower B (Hypertrophie)",
        "exos": [
          { "id": "front_squat", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "2" },
          { "id": "dumbbell_lunge", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "leg_extension", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" },
          { "id": "seated_leg_curl", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" },
          { "id": "seated_calf_raise", "sets": 3, "reps": "15-20", "rest": 60, "targetRir": "0" }
        ]
      }
    ]
  },
  {
    "id": "prog_ppl",
    "name": "Push Pull Legs (Avancé - 3/6j)",
    "sessions": [
      {
        "id": "ppl_push", "name": "PUSH (Pecs/Epaules/Tri)",
        "exos": [
          { "id": "barbell_bench_press", "sets": 4, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "incline_dumbbell_press", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "1" },
          { "id": "dumbbell_shoulder_press", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "dumbbell_lateral_raise", "sets": 4, "reps": "12-15", "rest": 60, "targetRir": "0" },
          { "id": "cable_pushdown", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" }
        ]
      },
      {
        "id": "ppl_pull", "name": "PULL (Dos/Bi/Arrière)",
        "exos": [
          { "id": "pull_up", "sets": 3, "reps": "6-8", "rest": 120, "targetRir": "1" },
          { "id": "seated_cable_row", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "1" },
          { "id": "face_pull", "sets": 3, "reps": "15-20", "rest": 60, "targetRir": "1" },
          { "id": "dumbbell_shrug", "sets": 3, "reps": "10-12", "rest": 60, "targetRir": "1" },
          { "id": "barbell_curl", "sets": 3, "reps": "10-12", "rest": 60, "targetRir": "0" }
        ]
      },
      {
        "id": "ppl_legs", "name": "LEGS (Jambes)",
        "exos": [
          { "id": "barbell_squat", "sets": 3, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "romanian_deadlift", "sets": 3, "reps": "8-10", "rest": 150, "targetRir": "2" },
          { "id": "leg_press", "sets": 3, "reps": "10-12", "rest": 120, "targetRir": "1" },
          { "id": "leg_extension", "sets": 3, "reps": "12-15", "rest": 60, "targetRir": "0" },
          { "id": "standing_calf_raise", "sets": 4, "reps": "12-15", "rest": 60, "targetRir": "0" }
        ]
      }
    ]
  },
  {
    "id": "prog_phul_final",
    "name": "PHUL (Power Hypertrophy)",
    "sessions": [
      {
        "id": "sess_j1",
        "name": "UPPER A (Power)",
        "exos": [
          { "id": "dumbbell_bench_press", "sets": 4, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "pull_up", "sets": 4, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "dumbbell_shoulder_press", "sets": 3, "reps": "8-10", "rest": 120, "targetRir": "2" },
          { "id": "seated_dumbbell_row", "sets": 3, "reps": "10-12", "rest": 90, "targetRir": "2" },
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
          { "id": "barbell_squat", "sets": 4, "reps": "6-8", "rest": 180, "targetRir": "2" },
          { "id": "romanian_deadlift", "sets": 4, "reps": "8-10", "rest": 150, "targetRir": "2" },
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
          { "id": "incline_dumbbell_press", "sets": 4, "reps": "10-12", "rest": 120, "targetRir": "1" },
          { "id": "chin_up", "sets": 4, "reps": "10-12", "rest": 120, "targetRir": "1" },
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
          { "id": "dumbbell_bulgarian_split_squat", "sets": 4, "reps": "8-10", "rest": 120, "targetRir": "2" },
          { "id": "hip_thrust", "sets": 4, "reps": "10-12", "rest": 120, "targetRir": "1" },
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
