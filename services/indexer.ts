
import { WorkoutSession, LibraryExercise, DashboardStats } from "../core/types";
import { MUSCLE_GROUPS, STORAGE_KEYS } from "../core/constants";
import { calculate1RM, parseDuration } from "../core/utils";

export const indexer = {
    calculateDashboardStats: (history: WorkoutSession[], library: LibraryExercise[]): DashboardStats => {
        const now = Date.now();
        const today = new Date();
        
        // 1. VOLUME CHART DATA
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay(); 
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0,0,0,0);

        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const volumeData = days.map(d => ({ day: d, val: 0 }));
        let weeklySets = 0;

        // 2. INSIGHTS DATA PREP
        const cutoff = now - (28 * 24 * 3600 * 1000); // 28 days
        const muscleCounts: Record<string, number> = {};
        
        // 3. MONTH STATS
        let monthSessionCount = 0;
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // 4. NEW PR DETECTION PREP
        let hasNewPR = false;
        
        if (history.length > 0) {
            // Month Stats
            history.forEach(s => {
                const d = new Date(s.startTime);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    monthSessionCount++;
                }

                // Volume Chart (Current Week)
                if (s.startTime >= startOfWeek.getTime()) {
                    let sDayIdx = d.getDay() - 1;
                    if (sDayIdx === -1) sDayIdx = 6; 
                    const setPayload = s.exercises.reduce((acc, ex) => acc + ex.sets.filter(st => st.done && !st.isWarmup).length, 0);
                    if (volumeData[sDayIdx]) {
                        volumeData[sDayIdx].val += setPayload;
                    }
                    weeklySets += setPayload;
                }

                // Insights (Last 28d)
                if (s.startTime > cutoff) {
                    s.exercises.forEach(e => {
                        const lib = library.find(l => l.id === e.exerciseId);
                        if (lib) {
                            if (!muscleCounts[lib.muscle]) muscleCounts[lib.muscle] = 0;
                            muscleCounts[lib.muscle] += e.sets.filter(st => st.done && !st.isWarmup).length;
                        }
                    });
                }
            });

            // PR Detection Logic (Optimized)
            if (history.length >= 2) {
                const lastSession = history[0];
                const previousHistory = history.slice(1);

                for (const ex of lastSession.exercises) {
                    if (hasNewPR) break; // Early exit if we already found one

                    const lib = library.find(l => l.id === ex.exerciseId);
                    if (!lib || lib.type === 'Étirement') continue;

                    const isCardio = lib.type === 'Cardio';
                    const isStatic = lib.type === 'Statique';

                    let currentMax = 0;
                    ex.sets.forEach(s => {
                        if (s.done && !s.isWarmup) {
                            let val = 0;
                            if (isCardio) val = parseFloat(s.reps) || 0;
                            else if (isStatic) val = parseDuration(s.reps);
                            else val = calculate1RM(s.weight, s.reps);
                            if (val > currentMax) currentMax = val;
                        }
                    });

                    if (currentMax > 0) {
                        let previousMax = 0;
                        // Scan previous history for this exercise
                        for (const h of previousHistory) {
                             const oldEx = h.exercises.find(e => e.exerciseId === ex.exerciseId);
                             if (oldEx) {
                                 oldEx.sets.forEach(s => {
                                    if (s.done && !s.isWarmup) {
                                        let val = 0;
                                        if (isCardio) val = parseFloat(s.reps) || 0;
                                        else if (isStatic) val = parseDuration(s.reps);
                                        else val = calculate1RM(s.weight, s.reps);
                                        if (val > previousMax) previousMax = val;
                                    }
                                 });
                             }
                        }
                        
                        if (currentMax > previousMax && previousMax > 0) {
                            hasNewPR = true;
                        }
                    }
                }

                // CHECK LAST SEEN: If user has seen records since this session, disable the notification
                if (hasNewPR) {
                    const lastSeen = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SEEN_PR) || '0');
                    if (lastSession.startTime <= lastSeen) {
                        hasNewPR = false;
                    }
                }
            }
        }

        // GENERATE INSIGHTS
        let insights = { title: "Bienvenue", text: "Commencez votre premier entraînement !" };
        if (history.length > 0) {
            insights = { title: "Bon Rythme", text: "Volume d'entraînement équilibré." };
            
            const avgWeekly: Record<string, number> = {};
            Object.keys(muscleCounts).forEach(m => {
                avgWeekly[m] = Math.round((muscleCounts[m] / 4) * 10) / 10;
            });

            const getVol = (m: string) => avgWeekly[m] || 0;
            const pecs = getVol('Pectoraux');
            const dos = getVol('Dos');

            if (dos > 0 && pecs / dos > 1.5) insights = { title: "Déséquilibre", text: "Volume Pectoraux > Dos (Ratio > 1.5)." };
            else if (pecs > 0 && dos / pecs > 1.5) insights = { title: "Déséquilibre", text: "Volume Dos > Pectoraux." };
            else {
                const muscles = Object.keys(avgWeekly);
                const neglectedPrimary = muscles.find(m => MUSCLE_GROUPS.PRIMARY.includes(m) && avgWeekly[m] < 10);
                if (neglectedPrimary) insights = { title: "Volume Faible", text: `${neglectedPrimary} est sous-dosé (< 10 sets/sem).` };
            }
        }

        return {
            volumeData,
            weeklySets,
            insights,
            monthSessionCount,
            hasNewPR,
            lastUpdated: now
        };
    }
};
