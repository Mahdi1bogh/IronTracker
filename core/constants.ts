
import { ExerciseType } from './types';
import { PALETTE } from '../styles/tokens';

export const STORAGE_KEYS = {
  LIB: "iron_v1_lib",
  PROGS: "iron_v1_progs",
  HIST: "iron_v1_hist",
  SESS: "iron_v1_sess",
  THEME: "iron_v1_theme",
  HAPTIC_TACTILE: "iron_v1_haptic_tactile",
  HAPTIC_SESSION: "iron_v1_haptic_session",
  LAST_SEEN_PR: "iron_v1_last_seen_pr"
};

export const THEMES = PALETTE.accents;

export const TYPE_COLORS: Record<ExerciseType, string> = {
  'Polyarticulaire': PALETTE.accents.red.primary,
  'Isolation': PALETTE.accents.blue.primary,
  'Cardio': PALETTE.accents.emerald.primary,
  'Statique': PALETTE.accents.purple.primary,
  'Étirement': PALETTE.text.secondary
};

export const MUSCLE_COLORS: Record<string, string> = {
  'Pectoraux': PALETTE.muscle.pecs,
  'Dos': PALETTE.muscle.back,
  'Jambes': PALETTE.muscle.legs,
  'Épaules': PALETTE.muscle.shoulders,
  'Bras': PALETTE.muscle.arms,
  'Abdos': PALETTE.muscle.abs,
  'Mollets': PALETTE.muscle.calves,
  'Avant-bras': PALETTE.muscle.forearms,
  'Cardio': PALETTE.muscle.cardio,
  'Cou': PALETTE.muscle.neck
};

export const MUSCLE_GROUPS = {
    PRIMARY: ['Pectoraux', 'Dos', 'Quadriceps', 'Ischios', 'Jambes'],
    SECONDARY: ['Biceps', 'Triceps', 'Bras', 'Épaules', 'Mollets', 'Abdos', 'Avant-bras', 'Cou']
};

export const FATIGUE_COLORS: Record<string, string> = PALETTE.fatigue;
