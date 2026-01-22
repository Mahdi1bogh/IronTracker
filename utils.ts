
import { WorkoutSession } from "./types";

export function calculate1RM(weight: any, reps: any): number {
  const w = parseFloat(String(weight));
  const r = parseInt(String(reps));
  if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return 0;
  if (r === 1) return Math.round(w);
  // Brzycki Formula
  const result = w * (36 / (37 - Math.min(r, 36)));
  return isFinite(result) ? Math.round(result) : 0;
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

export function downloadFile(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
