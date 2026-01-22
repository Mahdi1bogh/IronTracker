
export interface SetRecord {
  weight: string;
  reps: string;
  rir?: string;
  done: boolean;
  notes?: string;
}

export interface ExerciseInstance {
  id: string;
  target: string;
  rest: number;
  isBonus: boolean;
  notes: string;
  sets: SetRecord[];
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

export interface LibraryExercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
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

export type AccentColor = 'blue' | 'emerald' | 'gold' | 'purple' | 'red';
