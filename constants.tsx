
import { ExerciseType } from './types';
import { PALETTE } from './styles/tokens';

export const STORAGE_KEYS = {
  LIB: "iron_v1_lib",
  PROGS: "iron_v1_progs",
  HIST: "iron_v1_hist",
  SESS: "iron_v1_sess",
  THEME: "iron_v1_theme",
  HAPTIC_TACTILE: "iron_v1_haptic_tactile",
  HAPTIC_SESSION: "iron_v1_haptic_session"
};

export const THEMES = PALETTE.accents;

export const TYPE_COLORS: Record<ExerciseType, string> = {
  'Polyarticulaire': PALETTE.accents.red.primary,
  'Isolation': PALETTE.accents.blue.primary,
  'Cardio': PALETTE.accents.emerald.primary,
  'Isométrique': PALETTE.accents.purple.primary,
  'Étirement': PALETTE.accents.gray.primary
};

export const FATIGUE_COLORS: Record<string, string> = PALETTE.fatigue;
