
export interface SetRecord {
  weight: string;
  reps: string;
  rir?: string;
  done: boolean;
  notes?: string;
  completedAt?: number;
  isWarmup?: boolean; // New flag for warmup sets
}

export interface ExerciseInstance {
  exerciseId: number; // Foreign Key vers LibraryExercise
  target: string;
  rest: number;
  isBonus: boolean;
  notes: string;
  sets: SetRecord[];
  targetRir?: string;
}

export interface WorkoutSession {
  id: number;
  programName: string;
  sessionName: string;
  startTime: number;
  endTime?: number;
  bodyWeight: string;
  fatigue: string; // 1 to 5
  exercises: ExerciseInstance[];
  mode?: 'active' | 'log';
}

export type ExerciseType = 'Isolation' | 'Polyarticulaire' | 'Cardio' | 'Statique' | 'Étirement';

export interface LibraryExercise {
  id: number; // Primary Key (Numeric)
  name: string;
  type: ExerciseType;
  muscle: string;
  equipment: string;
  isFavorite?: boolean;
  isArchived?: boolean; // Soft Delete flag
  tips?: {
    setup?: string[];
    exec?: string[];
    mistake?: string[];
  };
}

export interface ProgramSession {
  id: string;
  name: string;
  exos: {
    exerciseId: number; // Foreign Key
    sets: number;
    reps: string;
    rest: number;
    targetRir?: string;
  }[];
}

export interface Program {
  id: string;
  name: string;
  sessions: ProgramSession[];
}

export type AccentColor = 'blue' | 'orange' | 'emerald' | 'gold' | 'purple' | 'red' | 'cyan' | 'gray';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Confirmation System Type
export interface ConfirmationOptions {
  title?: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}
