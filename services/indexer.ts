
import { WorkoutSession, LibraryExercise, DashboardStats, InsightItem } from "../core/types";
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

        // 2. INSIGHTS DATA PREP (7 Days Rolling Window)
        const cutoff = now - (7 * 24 * 3600 * 1000); 
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

                // Insights (Last 7d)
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

        // GENERATE INSIGHTS LIST
        let insightsList: InsightItem[] = [];

        if (history.length === 0) {
            insightsList.push({ 
                id: 'welcome', 
                title: "Bienvenue", 
                text: "Commencez votre premier entraînement !", 
                level: 'info', 
                priority: 1 
            });
        } else {
            const getVol = (m: string) => muscleCounts[m] || 0;
            const pecs = getVol('Pectoraux');
            const dos = getVol('Dos');
            const quads = getVol('Quadriceps');
            const ischios = getVol('Ischios');
            const fessiers = getVol('Fessiers');
            const jambes = getVol('Jambes');

            // --- EXCLUSION MUTUELLE LEGACY/MODERNE ---
            // Si l'utilisateur log précis (Quads+Ischios+Fessiers > 0), on ignore l'alerte sur le groupe global "Jambes"
            const hasPreciseLegsWork = (quads + ischios + fessiers) > 0;
            
            // Si l'utilisateur log global "Jambes" en quantité suffisante (>10), on ignore les alertes précises pour éviter les faux positifs
            const hasLegacyLegsWork = jambes > 10;

            // Check 1: Agonist/Antagonist Ratios
            if (dos > 0 && pecs / dos > 1.5) {
                insightsList.push({
                    id: 'ratio_push_pull',
                    title: "Déséquilibre",
                    text: "Volume Pectoraux > Dos (Ratio > 1.5).",
                    level: 'warning',
                    priority: 2
                });
            }
            if (pecs > 0 && dos / pecs > 1.5) {
                insightsList.push({
                    id: 'ratio_pull_push',
                    title: "Déséquilibre",
                    text: "Volume Dos > Pectoraux.",
                    level: 'info',
                    priority: 5
                });
            }
            if (ischios > 0 && quads / ischios > 2) {
                insightsList.push({
                    id: 'ratio_legs',
                    title: "Déséquilibre",
                    text: "Volume Quads dominant vs Ischios.",
                    level: 'warning',
                    priority: 3
                });
            }

            // Check 2: Low Volume on Primary Muscles (MEV < 10)
            MUSCLE_GROUPS.PRIMARY.forEach(muscle => {
                // LOGIQUE D'EXCLUSION
                if (muscle === 'Jambes' && hasPreciseLegsWork) return; // Mode Précis détecté : On ignore Jambes
                if (['Quadriceps', 'Ischios', 'Fessiers'].includes(muscle) && hasLegacyLegsWork) return; // Mode Global détecté : On ignore les détails

                const vol = muscleCounts[muscle] || 0;
                
                if (vol === 0) {
                    // Critical: Missing entirely from the week
                    insightsList.push({
                        id: `missing_${muscle}`,
                        title: "Manque",
                        text: `Aucun travail ${muscle} sur 7 jours.`,
                        level: 'danger',
                        priority: 1
                    });
                } else if (vol < 10) {
                    // Warning: Underdosed
                    insightsList.push({
                        id: `low_${muscle}`,
                        title: "Volume Faible",
                        text: `${muscle} sous-dosé (< 10 sets/sem).`,
                        level: 'warning',
                        priority: 4
                    });
                }
            });

            // Default State
            if (insightsList.length === 0) {
                insightsList.push({
                    id: 'good_pace',
                    title: "Bon Rythme",
                    text: "Volume d'entraînement équilibré.",
                    level: 'success',
                    priority: 10
                });
            }
        }

        // Sort by Priority (Low number = High Priority)
        insightsList.sort((a, b) => a.priority - b.priority);

        return {
            volumeData,
            weeklySets,
            insights: insightsList,
            monthSessionCount,
            hasNewPR,
            lastUpdated: now
        };
    }
};
