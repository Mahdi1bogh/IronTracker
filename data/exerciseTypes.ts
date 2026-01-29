
export const EXERCISE_TYPES = {
  POLY: "Polyarticulaire",
  ISO: "Isolation",
  CARDIO: "Cardio",
  STATIC: "Statique",
  STRETCH: "Étirement"
} as const;

export const EXERCISE_TYPE_LIST = Object.values(EXERCISE_TYPES);
