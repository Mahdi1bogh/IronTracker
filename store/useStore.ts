
import { create } from 'zustand';
import { WorkoutSession, LibraryExercise, Program, AccentColor, ConfirmationOptions, DashboardStats } from '../core/types';
import { storage } from '../services/storage';
import { indexer } from '../services/indexer';
import { DEFAULT_LIBRARY } from '../core/data/exerciseLibrary';
import { DEFAULT_PROGRAMS } from '../core/data/programs';

type SetStateAction<S> = S | ((prevState: S) => S);

interface StoreState {
  history: WorkoutSession[];
  library: LibraryExercise[];
  programs: Program[];
  session: WorkoutSession | null;
  accentColor: AccentColor;
  isLoaded: boolean;
  restTarget: number | null;
  
  // Computed Data (Cached)
  dashboardStats: DashboardStats | null;

  // Global Confirmation State
  confirmation: ConfirmationOptions | null;

  setHistory: (action: SetStateAction<WorkoutSession[]>) => void;
  setLibrary: (action: SetStateAction<LibraryExercise[]>) => void;
  setPrograms: (action: SetStateAction<Program[]>) => void;
  setSession: (action: SetStateAction<WorkoutSession | null>) => void;
  setAccentColor: (action: SetStateAction<AccentColor>) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  setRestTarget: (action: SetStateAction<number | null>) => void;
  
  // Confirmation Actions
  requestConfirmation: (options: ConfirmationOptions) => void;
  closeConfirmation: () => void;
  
  initData: () => void;
  resetData: () => void;
  
  // Helper to force re-indexing (internal use mainly)
  reindexDashboard: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  history: [],
  library: [],
  programs: [],
  session: null,
  accentColor: 'blue',
  isLoaded: false,
  restTarget: null,
  dashboardStats: null,
  confirmation: null,

  setHistory: (action) => {
      set(state => {
          const newHistory = typeof action === 'function' ? (action as Function)(state.history) : action;
          // Re-index stats immediately when history changes
          const newStats = indexer.calculateDashboardStats(newHistory, state.library);
          return { history: newHistory, dashboardStats: newStats };
      });
  },
  
  setLibrary: (action) => set(state => ({ library: typeof action === 'function' ? (action as Function)(state.library) : action })),
  setPrograms: (action) => set(state => ({ programs: typeof action === 'function' ? (action as Function)(state.programs) : action })),
  setSession: (action) => set(state => ({ session: typeof action === 'function' ? (action as Function)(state.session) : action })),
  setAccentColor: (action) => set(state => ({ accentColor: typeof action === 'function' ? (action as Function)(state.accentColor) : action })),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  setRestTarget: (action) => set(state => ({ restTarget: typeof action === 'function' ? (action as Function)(state.restTarget) : action })),

  requestConfirmation: (options) => set({ confirmation: options }),
  closeConfirmation: () => set({ confirmation: null }),

  reindexDashboard: () => {
      const state = get();
      const stats = indexer.calculateDashboardStats(state.history, state.library);
      set({ dashboardStats: stats });
  },

  initData: () => {
    let loadedLib = storage.library.load();
    let loadedProgs = storage.programs.load();
    let loadedHist = storage.history.load();
    let loadedSess = storage.session.load();
    const t = storage.theme.load() as AccentColor;

    if (loadedLib.length === 0) loadedLib = DEFAULT_LIBRARY;
    if (loadedProgs.length === 0) loadedProgs = DEFAULT_PROGRAMS;

    // Initial Indexing
    const initialStats = indexer.calculateDashboardStats(loadedHist, loadedLib);

    set({
      library: loadedLib,
      programs: loadedProgs,
      history: loadedHist,
      session: loadedSess,
      accentColor: t || 'blue',
      dashboardStats: initialStats,
      isLoaded: true
    });
  },

  resetData: () => {
    set({ isLoaded: false });
    localStorage.clear();
    
    storage.library.save(DEFAULT_LIBRARY);
    storage.programs.save(DEFAULT_PROGRAMS);
    
    get().initData();
  }
}));
