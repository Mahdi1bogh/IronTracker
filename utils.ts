
import { WorkoutSession, LibraryExercise } from "./types";

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
  return 0;
}

export function getExerciseStats(id: string, history: WorkoutSession[]) {
  let prE1RM = 0;
  let prMaxWeight = 0;
  let lastDetailed = "-";
  let lastE1RM = 0;

  history.forEach(h => {
    const ex = h.exercises.find(e => e.id === id);
    if (ex) {
      ex.sets.forEach(s => {
        if (s.done) {
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(s.reps) || 0;
          const e1rm = calculate1RM(w, r);
          if (e1rm > prE1RM) prE1RM = e1rm;
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
        // Format requested: 26,28,28 kg x 10,8,8 reps | RIR 1,1,0
        const weights = doneSets.map(s => s.weight).join(',');
        const reps = doneSets.map(s => s.reps).join(',');
        const rirs = doneSets.map(s => s.rir || '-').join(',');
        
        lastDetailed = `${weights} kg x ${reps} reps | RIR ${rirs}`;
        lastE1RM = Math.max(...doneSets.map(s => calculate1RM(s.weight, s.reps)));
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
    "Set_Order", "Weight_kg_or_Lest_or_lvl", "Reps_or_Distance", "RIR_or_Duration", 
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

      ex.sets.forEach((set, setIdx) => {
        if (!set.done) return; // Export only completed sets

        const weight = parseFloat(set.weight) || 0;
        const reps = parseFloat(set.reps) || 0; // Or distance
        const rirRaw = set.rir || "0"; // Or duration in seconds
        
        // Metrics
        const e1RM = (type === 'Cardio') ? 0 : calculate1RM(weight, reps);
        const tonnage = (type === 'Cardio') ? 0 : (weight * reps);
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
          safe(rirRaw), // Keep duration/rir as string (usually seconds for cardio)
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
