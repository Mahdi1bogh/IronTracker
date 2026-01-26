
import { WorkoutSession, LibraryExercise, ExerciseType } from "./types";

export function calculate1RM(weight: any, reps: any): number {
  const w = parseFloat(String(weight));
  const r = parseInt(String(reps));
  if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return 0;
  if (r === 1) return Math.round(w);
  
  // Wathen Formula
  const result = (100 * w) / (48.8 + (53.8 * Math.exp(-0.075 * r)));
  
  return isFinite(result) ? Math.round(result) : 0;
}

export function formatDuration(seconds: number | string): string {
  const val = parseInt(String(seconds));
  if (isNaN(val)) return "-";
  const m = Math.floor(val / 60);
  const s = val % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function parseDuration(input: string): number {
  if (!input) return 0;
  if (!input.includes(':')) return parseInt(input) || 0;
  
  const parts = input.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0]) || 0;
    const s = parseInt(parts[1]) || 0;
    return (m * 60) + s;
  }
  if (parts.length === 3) {
      const h = parseInt(parts[0]) || 0;
      const m = parseInt(parts[1]) || 0;
      const s = parseInt(parts[2]) || 0;
      return (h * 3600) + (m * 60) + s;
  }
  return 0;
}

export function smartFormatTime(input: string, type: 'Cardio' | 'Isométrique' | 'Other'): string {
  if (!input) return "";
  let clean = input.replace(/[.,]/g, ':').trim();

  if (/^\d+$/.test(clean)) {
      if (type === 'Cardio') {
          return `${clean}:00`;
      } else if (type === 'Isométrique') {
          return `00:${clean.padStart(2, '0')}`;
      }
      return clean;
  }

  const parts = clean.split(':');
  if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }

  return clean;
}

// Stats need explicit Library lookup now
export function getExerciseStats(exerciseId: number, history: WorkoutSession[], type?: ExerciseType) {
  let prE1RM = 0;
  let prMaxWeight = 0;
  let lastDetailed = "-";
  let lastE1RM = 0;

  const shouldCalc1RM = type && type !== 'Cardio' && type !== 'Isométrique' && type !== 'Étirement';

  history.forEach(h => {
    const ex = h.exercises.find(e => e.exerciseId === exerciseId);
    if (ex) {
      ex.sets.forEach(s => {
        if (s.done) {
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(s.reps) || 0;
          if (shouldCalc1RM) {
              const e1rm = calculate1RM(w, r);
              if (e1rm > prE1RM) prE1RM = e1rm;
          }
          if (w > prMaxWeight) prMaxWeight = w;
        }
      });
    }
  });

  const exerciseLogs = history
    .filter(h => h.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => b.startTime - a.startTime);

  if (exerciseLogs.length > 0) {
    const lastEx = exerciseLogs[0].exercises.find(e => e.exerciseId === exerciseId);
    if (lastEx) {
      const doneSets = lastEx.sets.filter(s => s.done);
      if (doneSets.length > 0) {
        const isCardio = type === 'Cardio';
        const isStatic = type === 'Isométrique' || type === 'Étirement';
        const unitW = isCardio ? "Lvl" : "kg";
        const unitR = isCardio ? "m" : isStatic ? "s" : "reps";

        const weights = doneSets.map(s => s.weight).join(',');
        const reps = doneSets.map(s => 
            isStatic ? formatDuration(parseDuration(s.reps)) : s.reps
        ).join(',');

        const rirs = doneSets.map(s => 
            isCardio ? formatDuration(s.rir || '0') : (s.rir || '-')
        ).join(',');
        
        lastDetailed = `${weights} ${unitW} x ${reps} ${unitR} | ${isCardio ? "" : "RIR "}${rirs}`;
        
        if (shouldCalc1RM) {
             lastE1RM = Math.max(...doneSets.map(s => calculate1RM(s.weight, s.reps)));
        }
      }
    }
  }

  return { pr: prE1RM, prMax: prMaxWeight, lastDetailed, lastE1RM };
}

export function triggerHaptic(type: 'success' | 'warning' | 'error' | 'click' | 'tick') {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    
    // Note: navigator.vibrate is ignored on iOS Safari by default, works on Android
    switch (type) {
        case 'success': navigator.vibrate([50, 50, 50]); break; // Validation série
        case 'warning': navigator.vibrate([200, 100, 200, 100, 500]); break; // Fin Timer
        case 'error': navigator.vibrate([50, 50, 50, 50, 100]); break; // Danger
        case 'click': navigator.vibrate(10); break; // Navigation
        case 'tick': navigator.vibrate(5); break; // Sélecteurs
    }
}

export function downloadFile(data: any, filename: string, mimeType: string = 'application/json') {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateCSV(history: WorkoutSession[], library: LibraryExercise[]): string {
  const headers = [
    "Date", "Program_name", "Session_name", "RPE_Session", "Bodyweight", 
    "Exercise_Order", "Exercise_name", "Muscle_Group", "Exercise_Type", "Exercise_Note", 
    "Set_Order", "Weight_or_Lest_or_lvl", "Reps_or_Dist_or_Duration", "RIR_or_Duration", 
    "Estimated_1RM", "Tonnage", "Validation_Timestamp"
  ];

  const rows = [headers.join(",")];
  const safe = (str: string) => {
    if (!str) return "";
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  history.sort((a, b) => a.startTime - b.startTime).forEach(session => {
    const date = new Date(session.startTime).toISOString().split('T')[0];
    
    session.exercises.forEach((ex, exIdx) => {
      // RELATIONAL LOOKUP
      const libEx = library.find(l => l.id === ex.exerciseId);
      const exoName = libEx?.name || `Unknown ID: ${ex.exerciseId}`;
      const muscle = libEx?.muscle || "Unknown";
      const type = libEx?.type || "Unknown";
      
      const note = ex.notes || "";
      const isCardio = type === 'Cardio';
      const isStatic = type === 'Isométrique' || type === 'Étirement';

      ex.sets.forEach((set, setIdx) => {
        if (!set.done) return;

        const weight = parseFloat(set.weight) || 0;
        let reps = 0;
        if (isStatic) {
            reps = parseDuration(set.reps);
        } else {
            reps = parseFloat(set.reps) || 0;
        }
        
        const rirMatch = (set.rir || "").match(/\d+/);
        const rirValue = isCardio ? parseDuration(set.rir || "0") : (rirMatch ? parseInt(rirMatch[0]) : 0);
        const rirRaw = isCardio ? String(rirValue) : (set.rir || "0");

        const e1RM = (isCardio || isStatic) ? 0 : calculate1RM(weight, reps);
        const tonnage = (isCardio || isStatic) ? 0 : (weight * reps);
        const timestamp = set.completedAt ? new Date(set.completedAt).toISOString() : new Date(session.startTime).toISOString();

        const row = [
          date,
          safe(session.programName),
          safe(session.sessionName),
          session.fatigue,
          session.bodyWeight,
          exIdx + 1,
          safe(exoName),
          safe(muscle),
          safe(type),
          safe(note),
          setIdx + 1,
          weight,
          reps,
          safe(rirRaw), 
          e1RM,
          tonnage,
          timestamp
        ];

        rows.push(row.join(","));
      });
    });
  });

  return rows.join("\n");
}
