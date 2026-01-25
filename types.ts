
export interface SetRecord {
  weight: string;
  reps: string;
  rir?: string;
  done: boolean;
  notes?: string;
  completedAt?: number;
}

export interface ExerciseInstance {
  id: string;
  target: string;
  rest: number;
  isBonus: boolean;
  notes: string;
  sets: SetRecord[];
  targetRir?: string; // New field for static target goal
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
}

export type ExerciseType = 'Isolation' | 'Polyarticulaire' | 'Cardio' | 'Isométrique' | 'Étirement';

export interface LibraryExercise {
  id: string;
  name: string;
  type: ExerciseType;
  muscle: string;
  equipment: string;
  isFavorite?: boolean;
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
    id: string;
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

export enum View {
  Dashboard = 'dashboard',
  Programs = 'programs',
  Workout = 'workout',
  Analytics = 'analytics',
  Settings = 'settings',
  Records = 'records',
  EditorProgram = 'editor_program',
  OneRMCalculator = '1rm_calculator',
  Library = 'library'
}

export type AccentColor = 'blue' | 'emerald' | 'gold' | 'purple' | 'red' | 'cyan' | 'gray';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
