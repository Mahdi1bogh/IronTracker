
import { WorkoutSession, LibraryExercise, ExerciseType } from "./types";

export function calculate1RM(weight: any, reps: any): number {
  const w = parseFloat(String(weight));
  const r = parseInt(String(reps));
  if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return 0;
  if (r === 1) return Math.round(w);
  
  // Wathen Formula
  // 1RM = (100 * w) / (48.8 + (53.8 * Math.exp(-0.075 * r)))
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
  // Support integers as seconds directly (legacy or direct input)
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

// Smart Input Pivot: Converts . or , to : and handles default integer logic
export function smartFormatTime(input: string, type: 'Cardio' | 'Isométrique' | 'Other'): string {
  if (!input) return "";
  // 1. Replace separators (dot, comma) with colon
  let clean = input.replace(/[.,]/g, ':').trim();

  // 2. Check if simple integer (no separators)
  if (/^\d+$/.test(clean)) {
      if (type === 'Cardio') {
          // Default to Minutes for Cardio (ex: 10 -> 10:00)
          return `${clean}:00`;
      } else if (type === 'Isométrique') {
          // Default to Seconds for Iso (ex: 45 -> 00:45)
          return `00:${clean.padStart(2, '0')}`;
      }
      return clean;
  }

  // 3. Formatting H:M:S or M:S logic
  const parts = clean.split(':');
  
  // 1.20 -> 01:20
  if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  // 1.01.20 -> 01:01:20
  if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }

  return clean;
}

export function getExerciseStats(id: string, history: WorkoutSession[], type?: ExerciseType) {
  let prE1RM = 0;
  let prMaxWeight = 0;
  let lastDetailed = "-";
  let lastE1RM = 0;

  // Exclude non-weight/reps types from PR calculation
  const shouldCalc1RM = type && type !== 'Cardio' && type !== 'Isométrique' && type !== 'Étirement';

  history.forEach(h => {
    const ex = h.exercises.find(e => e.id === id);
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
    .filter(h => h.exercises.some(e => e.id === id))
    .sort((a, b) => b.startTime - a.startTime);

  if (exerciseLogs.length > 0) {
    const lastEx = exerciseLogs[0].exercises.find(e => e.id === id);
    if (lastEx) {
      const doneSets = lastEx.sets.filter(s => s.done);
      if (doneSets.length > 0) {
        const isCardio = type === 'Cardio';
        const isStatic = type === 'Isométrique' || type === 'Étirement';
        const unitW = isCardio ? "Lvl" : "kg";
        const unitR = isCardio ? "m" : isStatic ? "s" : "reps";

        const weights = doneSets.map(s => s.weight).join(',');
        
        // Handling Reps display: 
        // For Static, stored data is seconds. parseDuration ensures number, formatDuration makes it MM:SS.
        const reps = doneSets.map(s => 
            isStatic ? formatDuration(parseDuration(s.reps)) : s.reps
        ).join(',');

        // Handling RIR/Duration display for Cardio
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

  // Helper to escape text for CSV
  const safe = (str: string) => {
    if (!str) return "";
    const s = String(str).replace(/"/g, '""'); // Double quotes
    return `"${s}"`;
  };

  history.sort((a, b) => a.startTime - b.startTime).forEach(session => {
    const date = new Date(session.startTime).toISOString().split('T')[0];
    
    session.exercises.forEach((ex, exIdx) => {
      const libEx = library.find(l => l.id === ex.id);
      const exoName = libEx?.name || ex.id;
      const muscle = libEx?.muscle || "Unknown";
      const type = libEx?.type || "Unknown";
      const note = ex.notes || "";
      const isCardio = type === 'Cardio';
      const isStatic = type === 'Isométrique' || type === 'Étirement';

      ex.sets.forEach((set, setIdx) => {
        if (!set.done) return; // Export only completed sets

        const weight = parseFloat(set.weight) || 0;
        
        // Standardize duration/reps for CSV (always export number)
        let reps = 0;
        if (isStatic) {
            reps = parseDuration(set.reps); // Handles "45" or "00:45"
        } else {
            reps = parseFloat(set.reps) || 0;
        }
        
        // Extract numeric value from RIR string for calculations (e.g. "~2" -> 2)
        const rirMatch = (set.rir || "").match(/\d+/);
        // For Cardio, rir field is Duration. Export as seconds.
        const rirValue = isCardio ? parseDuration(set.rir || "0") : (rirMatch ? parseInt(rirMatch[0]) : 0);
        const rirRaw = isCardio ? String(rirValue) : (set.rir || "0"); // Export raw seconds for cardio in CSV

        // Metrics
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
