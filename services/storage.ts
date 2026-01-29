
import { 
    LibraryExercise, 
    Program, 
    WorkoutSession, 
    ExerciseInstance, 
    SetRecord, 
    ProgramSession
} from "../types";
import { 
    MinifiedLibraryItem, 
    MinifiedProgram, 
    MinifiedSession, 
    MinifiedSet, 
    MinifiedExoInstance,
    TYPE_MAP, 
    REVERSE_TYPE_MAP, 
    MUSCLE_MAP, 
    REVERSE_MUSCLE_MAP,
    MinifiedProgramSession
} from "../data/mappings";
import { STORAGE_KEYS } from "../constants";

// --- HELPERS DEHYDRATION (App -> Minified) ---

const dehydrateSet = (s: SetRecord): MinifiedSet => {
    const min: MinifiedSet = {
        w: s.weight,
        r: s.reps,
        d: s.done ? 1 : 0
    };
    if (s.rir) min.ri = s.rir;
    if (s.notes) min.n = s.notes;
    if (s.completedAt) min.ca = s.completedAt;
    if (s.isWarmup) min.wu = 1;
    return min;
};

const dehydrateExoInstance = (e: ExerciseInstance): MinifiedExoInstance => {
    const min: MinifiedExoInstance = {
        e: e.exerciseId,
        t: e.target,
        r: e.rest,
        s: e.sets.map(dehydrateSet)
    };
    if (e.isBonus) min.b = 1;
    if (e.notes) min.n = e.notes;
    if (e.targetRir) min.tr = e.targetRir;
    return min;
};

const dehydrateSession = (s: WorkoutSession): MinifiedSession => {
    const min: MinifiedSession = {
        i: s.id,
        pn: s.programName,
        sn: s.sessionName,
        dt: s.startTime,
        e: s.exercises.map(dehydrateExoInstance)
    };
    if (s.endTime) min.ed = s.endTime;
    if (s.bodyWeight) min.bw = s.bodyWeight;
    if (s.fatigue) min.f = s.fatigue;
    return min;
};

const dehydrateLibraryItem = (l: LibraryExercise): MinifiedLibraryItem => {
    const min: MinifiedLibraryItem = {
        i: l.id,
        n: l.name,
        t: TYPE_MAP[l.type] || 'I', 
        m: MUSCLE_MAP[l.muscle] || 'OT', 
        eq: l.equipment
    };
    if (l.isFavorite) min.f = 1;
    if (l.isArchived) min.ia = 1;
    if (l.tips) {
        min.tp = {};
        if (l.tips.setup && l.tips.setup.length) min.tp.s = l.tips.setup;
        if (l.tips.exec && l.tips.exec.length) min.tp.e = l.tips.exec;
        if (l.tips.mistake && l.tips.mistake.length) min.tp.m = l.tips.mistake;
        if (Object.keys(min.tp).length === 0) delete min.tp;
    }
    return min;
};

const dehydrateProgram = (p: Program): MinifiedProgram => {
    return {
        i: p.id,
        n: p.name,
        s: p.sessions.map(s => ({
            i: s.id,
            n: s.name,
            e: s.exos.map(e => {
                const exMin: any = {
                    e: e.exerciseId,
                    s: e.sets,
                    r: e.reps,
                    rt: e.rest
                };
                if (e.targetRir) exMin.tr = e.targetRir;
                return exMin;
            })
        }))
    };
};

// --- HELPERS HYDRATION (Minified -> App) ---

const hydrateSet = (ms: any): SetRecord => {
    return {
        weight: String(ms.w),
        reps: String(ms.r),
        rir: ms.ri,
        done: ms.d === 1,
        notes: ms.n,
        completedAt: ms.ca,
        isWarmup: ms.wu === 1
    };
};

const hydrateExoInstance = (me: any): ExerciseInstance => {
    return {
        exerciseId: me.e,
        target: me.t,
        rest: me.r,
        isBonus: me.b === 1,
        notes: me.n || "",
        sets: (me.s || []).map(hydrateSet),
        targetRir: me.tr
    };
};

const hydrateSession = (ms: any): WorkoutSession => {
    return {
        id: ms.i,
        programName: ms.pn,
        sessionName: ms.sn,
        startTime: ms.dt,
        endTime: ms.ed,
        bodyWeight: ms.bw || "",
        fatigue: ms.f || "3",
        exercises: (ms.e || []).map(hydrateExoInstance)
    };
};

const hydrateLibraryItem = (ml: any): LibraryExercise => {
    const lib: LibraryExercise = {
        id: ml.i,
        name: ml.n,
        type: REVERSE_TYPE_MAP[ml.t] || 'Isolation',
        muscle: REVERSE_MUSCLE_MAP[ml.m] || ml.m, 
        equipment: ml.eq
    };
    if (ml.f === 1) lib.isFavorite = true;
    if (ml.ia === 1) lib.isArchived = true;
    if (ml.tp) {
        lib.tips = {
            setup: ml.tp.s,
            exec: ml.tp.e,
            mistake: ml.tp.m
        };
    }
    return lib;
};

const hydrateProgram = (mp: any): Program => {
    return {
        id: mp.i,
        name: mp.n,
        sessions: (mp.s || []).map((ms: MinifiedProgramSession) => ({
            id: ms.i,
            name: ms.n,
            exos: (ms.e || []).map(me => ({
                exerciseId: me.e,
                sets: me.s,
                reps: me.r,
                rest: me.rt,
                targetRir: me.tr
            }))
        }))
    };
};

// --- SERVICE EXPORT ---

export const storage = {
    library: {
        load: (): LibraryExercise[] => {
            try {
                const raw = localStorage.getItem(STORAGE_KEYS.LIB);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                return parsed.map(hydrateLibraryItem);
            } catch (e) { console.error("Lib Load Error", e); return []; }
        },
        save: (data: LibraryExercise[]) => {
            const minified = data.map(dehydrateLibraryItem);
            localStorage.setItem(STORAGE_KEYS.LIB, JSON.stringify(minified));
        }
    },
    programs: {
        load: (): Program[] => {
            try {
                const raw = localStorage.getItem(STORAGE_KEYS.PROGS);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                return parsed.map(hydrateProgram);
            } catch (e) { console.error("Prog Load Error", e); return []; }
        },
        save: (data: Program[]) => {
            const minified = data.map(dehydrateProgram);
            localStorage.setItem(STORAGE_KEYS.PROGS, JSON.stringify(minified));
        }
    },
    history: {
        load: (): WorkoutSession[] => {
            try {
                const raw = localStorage.getItem(STORAGE_KEYS.HIST);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                return parsed.map(hydrateSession);
            } catch (e) { console.error("Hist Load Error", e); return []; }
        },
        save: (data: WorkoutSession[]) => {
            const minified = data.map(dehydrateSession);
            localStorage.setItem(STORAGE_KEYS.HIST, JSON.stringify(minified));
        }
    },
    session: {
        load: (): WorkoutSession | null => {
            try {
                const raw = localStorage.getItem(STORAGE_KEYS.SESS);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return hydrateSession(parsed);
            } catch (e) { console.error("Sess Load Error", e); return null; }
        },
        save: (data: WorkoutSession | null) => {
            if (!data) {
                localStorage.removeItem(STORAGE_KEYS.SESS);
                return;
            }
            const minified = dehydrateSession(data);
            localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify(minified));
        }
    },
    theme: {
        load: (): string => localStorage.getItem(STORAGE_KEYS.THEME) || 'blue',
        save: (t: string) => localStorage.setItem(STORAGE_KEYS.THEME, t)
    }
};
