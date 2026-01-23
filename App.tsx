
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, WorkoutSession, Program, LibraryExercise, ExerciseInstance, SetRecord, AccentColor, BeforeInstallPromptEvent } from './types';
import { STORAGE_KEYS, Icons, THEMES } from './constants';
import { getExerciseStats, calculate1RM, downloadFile } from './utils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, ReferenceLine, LineChart, Line, Cell, PieChart, Pie, ComposedChart } from 'recharts';

// --- DATA ---
const DEFAULT_LIBRARY: LibraryExercise[] = [
    { "id": "barbell_bench_press", "name": "Barbell Bench Press", "muscle": "Pectoraux", "equipment": "BB", "tips": { "setup": ["Omoplates serrées (rétraction)", "Pieds ancrés au sol", "Dos cambré (arc naturel)"], "exec": ["Barre sur bas des pecs", "Coudes à 45° du corps", "Pousser en gardant les épaules collées"], "mistake": ["Décoller les fesses", "Rebondir sur la poitrine"] } },
    { "id": "dumbbell_bench_press", "name": "Dumbbell Bench Press", "muscle": "Pectoraux", "equipment": "DB", "tips": { "setup": ["Banc à plat", "Pieds stables au sol"], "exec": ["Descendre haltères niveau poitrine", "Trajectoire légèrement convergente"], "mistake": ["Coudes trop écartés (90°)", "Manque de stabilité"] } },
    { "id": "incline_bench_press", "name": "Incline Bench Press", "muscle": "Pectoraux", "equipment": "Bench", "tips": { "setup": ["Banc incliné 30-45°", "Omoplates serrées"], "exec": ["Toucher le haut des pecs (clavicules)", "Extension complète"], "mistake": ["Banc trop incliné (épaules dominantes)", "Dos décollé"] } },
    { "id": "incline_dumbbell_press", "name": "Incline Dumbbell Press", "muscle": "Pectoraux", "equipment": "DB", "tips": { "setup": ["Banc 30°", "Poitrine sortie"], "exec": ["Pousser vers le plafond", "Contrôler la descente"], "mistake": ["Coudes trop ouverts", "Amplitude réduite"] } },
    { "id": "bar_dip", "name": "Bar Dip", "muscle": "Pectoraux", "equipment": "BW", "tips": { "setup": ["Buste penché en avant (focus pecs)", "Jambes croisées"], "exec": ["Descendre jusqu'à l'étirement confortable", "Pousser"], "mistake": ["Descendre trop bas (danger épaules)", "Rester trop droit (focus triceps)"] } },
    { "id": "pec_deck", "name": "Pec Deck", "muscle": "Pectoraux", "equipment": "EM", "tips": { "setup": ["Siège réglé pour bras // au sol", "Dos plaqué"], "exec": ["Resserrer les coudes/mains devant", "Contraction 1s"], "mistake": ["Décoller le dos", "Utiliser l'élan"] } },
    { "id": "dumbbell_chest_fly", "name": "Dumbbell Chest Fly", "muscle": "Pectoraux", "equipment": "DB", "tips": { "setup": ["Banc plat", "Coudes légèrement fléchis"], "exec": ["Ouvrir les bras en arc de cercle", "Ressentir l'étirement"], "mistake": ["Tendre les bras complètement", "Aller trop lourd"] } },
    { "id": "standing_cable_chest_fly", "name": "Standing Cable Chest Fly", "muscle": "Pectoraux", "equipment": "RC", "tips": { "setup": ["Un pied devant pour l'équilibre", "Buste penché"], "exec": ["Amener les poignées devant le nombril", "Serrer les pecs"], "mistake": ["Épaules qui remontent", "Balancier du corps"] } },
    { "id": "dumbbell_seated_overhead_press", "name": "Dumbbell Seated Overhead Press", "muscle": "Épaules", "equipment": "DB", "tips": { "setup": ["Banc à 90°", "Dos plaqué", "Pieds ancrés"], "exec": ["Pousser vers le plafond", "Contrôler la descente oreilles"], "mistake": ["Cambrer le bas du dos excessivement", "Descendre trop bas"] } },
    { "id": "barbell_overhead_press", "name": "Barbell Overhead Press", "muscle": "Épaules", "equipment": "BB", "tips": { "setup": ["Gainage abdos/fessiers fort", "Prise largeur épaules"], "exec": ["Trajectoire verticale (tête s'efface)", "Extension complète"], "mistake": ["Pousser vers l'avant", "S'aider des jambes (Push Press)"] } },
    { "id": "arnold_press", "name": "Arnold Press", "muscle": "Épaules", "equipment": "DB", "tips": { "setup": ["Haltères devant, paumes vers soi"], "exec": ["Rotation en poussant", "Finir paumes vers l'avant"], "mistake": ["Manque de fluidité", "Charge trop lourde"] } },
    { "id": "dumbbell_lateral_raise", "name": "Dumbbell Lateral Raise", "muscle": "Épaules", "equipment": "DB", "tips": { "setup": ["Buste très légèrement penché", "Genoux fléchis"], "exec": ["Lever avec les coudes", "Pas plus haut que l'épaule"], "mistake": ["Utiliser l'élan (swing)", "Monter les trapèzes"] } },
    { "id": "cable_lateral_raise", "name": "Cable Lateral Raise", "muscle": "Épaules", "equipment": "RC", "tips": { "setup": ["Poulie basse", "Main opposée"], "exec": ["Tirer sur le côté", "Mouvement fluide"], "mistake": ["Acoups", "Rotation du buste"] } },
    { "id": "face_pull", "name": "Face Pull", "muscle": "Épaules", "equipment": "RC", "tips": { "setup": ["Poulie hauteur visage", "Prise neutre"], "exec": ["Tirer vers le front/oreilles", "Rotation externe en fin"], "mistake": ["Aller trop lourd", "Tirer avec les biceps"] } },
    { "id": "reverse_pec_deck", "name": "Reverse Pec Deck", "muscle": "Épaules", "equipment": "EM", "tips": { "setup": ["Face à la machine", "Bras tendus"], "exec": ["Ouvrir les bras vers l'arrière", "Focus arrière d'épaule"], "mistake": ["Plier les bras", "Creuser le dos"] } },
    { "id": "reverse_dumbbell_fly", "name": "Reverse Dumbbell Fly", "muscle": "Épaules", "equipment": "DB", "tips": { "setup": ["Buste // au sol", "Dos plat"], "exec": ["Lever les bras sur le côté", "Omoplates fixes"], "mistake": ["Relever le buste", "Élan"] } },
    { "id": "pull_up", "name": "Pull-Up", "muscle": "Dos", "equipment": "BW", "tips": { "setup": ["Prise pronation large", "Corps gainé"], "exec": ["Amener le menton au dessus de la barre", "Contrôler la descente"], "mistake": ["Kipping (élan)", "Amplitude partielle", "Épaules aux oreilles"] } },
    { "id": "chin_up", "name": "Chin-Up", "muscle": "Dos", "equipment": "BW", "tips": { "setup": ["Prise supination (paumes vers soi)"], "exec": ["Tirer jusqu'au menton", "Contrôler"], "mistake": ["Se balancer", "Descendre à moitié"] } },
    { "id": "lat_pulldown", "name": "Lat Pulldown", "muscle": "Dos", "equipment": "RC", "tips": { "setup": ["Bloquer les genoux", "Poitrine sortie"], "exec": ["Tirer la barre vers le haut des pecs", "Coudes vers le bas"], "mistake": ["Se pencher trop en arrière", "Tirer derrière la nuque"] } },
    { "id": "barbell_bent_over_row", "name": "Barbell Bent Over Row", "muscle": "Dos", "equipment": "BB", "tips": { "setup": ["Buste penché 45°", "Dos neutre (plat)"], "exec": ["Tirer la barre au nombril", "Serrer les omoplates"], "mistake": ["Arrondir le dos (Danger!)", "Utiliser l'élan des hanches"] } },
    { "id": "seal_row", "name": "Seal Row", "muscle": "Dos", "equipment": "Bench", "tips": { "setup": ["Allongé sur banc surélevé", "Haltères au sol"], "exec": ["Tirer les coudes vers le haut", "Zéro élan"], "mistake": ["Banc trop bas", "Amplitude incomplète"] } },
    { "id": "seated_dumbbell_row", "name": "Seated Dumbbell Row", "muscle": "Dos", "equipment": "DB", "tips": { "setup": ["Un genou sur le banc", "Dos plat", "Main d'appui sous l'épaule"], "exec": ["Tirer l'haltère vers la hanche (pas l'épaule)", "Coude proche du corps"], "mistake": ["Rotation du buste", "Tirer trop haut"] } },
    { "id": "seated_cable_row", "name": "Seated Cable Row", "muscle": "Dos", "equipment": "RC", "tips": { "setup": ["Pieds calés", "Dos droit", "Genoux fléchis"], "exec": ["Tirer la poignée au ventre", "Sortir la poitrine"], "mistake": ["Se pencher avant/arrière", "Épaules en avant"] } },
    { "id": "t_bar_row", "name": "T-Bar Row", "muscle": "Dos", "equipment": "TB", "tips": { "setup": ["Entre les jambes", "Dos plat impératif"], "exec": ["Tirer vers le haut", "Contracter le dos"], "mistake": ["Arrondir les lombaires", "Élan excessif"] } },
    { "id": "back_extension", "name": "Back Extension", "muscle": "Dos", "equipment": "BW", "tips": { "setup": ["Banc à lombaires réglé aux hanches"], "exec": ["Descendre dos plat", "Remonter aligné"], "mistake": ["Hyper-extension (cambrer trop)", "Vitesse excessive"] } },
    { "id": "barbell_squat", "name": "Barbell Squat", "muscle": "Jambes", "equipment": "BB", "tips": { "setup": ["Barre sur trapèzes", "Pieds largeur épaules", "Regard droit"], "exec": ["Hanches en arrière et bas", "Genoux vers l'extérieur", "Briser la parallèle"], "mistake": ["Genoux qui rentrent (valgus)", "Talons qui décollent", "Dos qui s'arrondit"] } },
    { "id": "leg_press", "name": "Leg Press", "muscle": "Jambes", "equipment": "EM", "tips": { "setup": ["Dos plaqué au siège", "Pieds largeur bassin"], "exec": ["Descendre genoux vers épaules", "Pousser sans verrouiller"], "mistake": ["Décoller les fesses du siège", "Verrouiller les genoux (Danger!)"] } },
    { "id": "dumbbell_bulgarian_split_squat", "name": "Dumbbell Bulgarian Split Squat", "muscle": "Jambes", "equipment": "DB", "tips": { "setup": ["Un pied sur banc arrière", "Équilibre stable"], "exec": ["Descendre genou arrière vers le sol", "Buste légèrement penché"], "mistake": ["Pied avant trop proche (talon décolle)", "Genou rentrant"] } },
    { "id": "leg_extension", "name": "Leg Extension", "muscle": "Jambes", "equipment": "EM", "tips": { "setup": ["Genou aligné avec l'axe machine", "Dos calé"], "exec": ["Tendre les jambes", "Contrôler la descente"], "mistake": ["Lancer la charge", "Décoller les fesses"] } },
    { "id": "romanian_deadlift", "name": "Romanian Deadlift", "muscle": "Jambes", "equipment": "BB", "tips": { "setup": ["Pieds largeur hanches", "Omoplates serrées"], "exec": ["Pousser les fesses en arrière", "Jambes semi-tendues", "Descendre tant que le dos est plat"], "mistake": ["Arrondir le dos", "Transformer en Squat", "Barre trop loin des jambes"] } },
    { "id": "lying_leg_curl", "name": "Lying Leg Curl", "muscle": "Jambes", "equipment": "EM", "tips": { "setup": ["Genoux hors du banc", "Hanches plaquées"], "exec": ["Ramener talons aux fesses", "Contrôler le retour"], "mistake": ["Décoller les hanches (cambrer)", "Mouvement partiel"] } },
    { "id": "seated_leg_curl", "name": "Seated Leg Curl", "muscle": "Jambes", "equipment": "EM", "tips": { "setup": ["Genoux alignés axe", "Bloqueur sur cuisses"], "exec": ["Fléchir vers le bas", "Retenir la montée"], "mistake": ["Décoller le dos", "Mouvement trop rapide"] } },
    { "id": "hip_thrust", "name": "Hip Thrust", "muscle": "Jambes", "equipment": "BB", "tips": { "setup": ["Omoplates sur banc", "Barre sur le creux des hanches"], "exec": ["Monter le bassin", "Contracter fort les fessiers"], "mistake": ["Cambrer le dos", "Pousser avec les pointes de pieds"] } },
    { "id": "barbell_curl", "name": "Barbell Curl", "muscle": "Bras", "equipment": "BB", "tips": { "setup": ["Debout", "Coudes proches du corps"], "exec": ["Flexion complète sans bouger les coudes"], "mistake": ["Balancier du buste", "Avancer les coudes"] } },
    { "id": "ez_bar_curl", "name": "EZ-Bar Curl", "muscle": "Bras", "equipment": "EZ", "tips": { "setup": ["Barre EZ (moins de stress poignets)"], "exec": ["Flexion biceps stricte"], "mistake": ["Utiliser le dos", "Coudes qui s'écartent"] } },
    { "id": "dumbbell_hammer_curl", "name": "Dumbbell Hammer Curl", "muscle": "Bras", "equipment": "DB", "tips": { "setup": ["Prise neutre (pouces vers haut)"], "exec": ["Monter vers l'épaule", "Alterné ou simultané"], "mistake": ["Rotation du poignet", "Élan"] } },
    { "id": "preacher_curl", "name": "Preacher Curl", "muscle": "Bras", "equipment": "EM", "tips": { "setup": ["Aisselles sur le pupitre", "Bras tendus"], "exec": ["Flexion sans décoller les triceps"], "mistake": ["Décoller les fesses", "Amplitude trop courte"] } },
    { "id": "close_grip_bench_press", "name": "Close-Grip Bench Press", "muscle": "Bras", "equipment": "BB", "tips": { "setup": ["Mains largeur épaules (pas trop serré)", "Coudes rentrés"], "exec": ["Descendre bas de poitrine", "Pousser triceps"], "mistake": ["Mains trop serrées (poignets)", "Coudes écartés"] } },
    { "id": "cable_pushdown", "name": "Cable Pushdown", "muscle": "Bras", "equipment": "RC", "tips": { "setup": ["Coudes verrouillés le long du corps", "Genoux fléchis"], "exec": ["Extension complète vers le bas", "Écarter la corde en bas"], "mistake": ["Monter les coudes", "Se pencher trop"] } },
    { "id": "dumbbell_overhead_triceps_extension", "name": "DB Overhead Triceps Ext.", "muscle": "Bras", "equipment": "DB", "tips": { "setup": ["Assis ou debout", "Haltère à deux mains"], "exec": ["Descendre derrière la tête", "Extension complète"], "mistake": ["Coudes trop ouverts", "Cambrer le dos"] } },
    { "id": "cable_overhead_triceps_extension", "name": "Cable Overhead Triceps Ext.", "muscle": "Bras", "equipment": "RC", "tips": { "setup": ["Dos à la poulie", "Coudes hauts"], "exec": ["Tendre les bras vers l'avant/haut"], "mistake": ["Manque de stabilité", "Bouger les épaules"] } },
    { "id": "barbell_lying_triceps_extension", "name": "Skullcrusher", "muscle": "Bras", "equipment": "BB", "tips": { "setup": ["Allongé", "Barre au dessus du front"], "exec": ["Plier les coudes vers le front/arrière tête", "Extension"], "mistake": ["Coudes qui s'écartent", "Bouger les épaules"] } },
    { "id": "hanging_leg_raise", "name": "Hanging Leg Raise", "muscle": "Abdos", "equipment": "BW", "tips": { "setup": ["Suspendu à la barre", "Corps stable"], "exec": ["Remonter genoux ou jambes vers poitrine", "Enrouler le bassin"], "mistake": ["Balancier", "Ne pas enrouler le bassin"] } },
    { "id": "cable_woodchopper", "name": "Cable Woodchopper", "muscle": "Abdos", "equipment": "RC", "tips": { "setup": ["Poulie hauteur épaule", "De profil"], "exec": ["Rotation du buste vers genou opposé", "Bras tendus"], "mistake": ["Plier les bras", "Tourner les hanches"] } },
    { "id": "cable_crunch", "name": "Cable Crunch", "muscle": "Abdos", "equipment": "RC", "tips": { "setup": ["A genoux face poulie", "Corde derrière nuque"], "exec": ["Enrouler le dos vers le sol", "Contracter abdos"], "mistake": ["Tirer avec les bras", "Garder le dos plat"] } },
    { "id": "crunch", "name": "Crunch", "muscle": "Abdos", "equipment": "BW", "tips": { "setup": ["Au sol", "Jambes pliées"], "exec": ["Décoller les omoplates", "Regard vers genoux"], "mistake": ["Tirer sur la nuque", "Décoller le bas du dos"] } },
    { "id": "sit_up", "name": "Sit-Up", "muscle": "Abdos", "equipment": "BW", "tips": { "setup": ["Pieds bloqués", "Genoux pliés"], "exec": ["Remonter tout le buste"], "mistake": ["Dos plat (préférer enroulement)", "Acoups"] } },
    { "id": "weighted_sit_up", "name": "Weighted Sit-Up", "muscle": "Abdos", "equipment": "Plate", "tips": { "setup": ["Disque sur la poitrine"], "exec": ["Idem Sit-Up avec charge"], "mistake": ["Utiliser l'élan du poids"] } },
    { "id": "plank", "name": "Plank", "muscle": "Abdos", "equipment": "BW", "tips": { "setup": ["Appui avant-bras/orteils", "Corps aligné"], "exec": ["Serrer fesses et abdos", "Respirer"], "mistake": ["Dos creusé (Danger!)", "Fesses trop hautes"] } },
    { "id": "standing_calf_raise", "name": "Standing Calf Raise", "muscle": "Mollets", "equipment": "EM", "tips": { "setup": ["Pointes de pieds sur marche", "Jambes tendues"], "exec": ["Descendre talon au max", "Monter sur pointes"], "mistake": ["Rebondir en bas", "Amplitude réduite"] } },
    { "id": "seated_calf_raise", "name": "Seated Calf Raise", "muscle": "Mollets", "equipment": "EM", "tips": { "setup": ["Assis", "Bloqueur sur genoux"], "exec": ["Extension cheville complète"], "mistake": ["Aider avec les mains", "Vitesse trop rapide"] } },
    { "id": "barbell_wrist_curl", "name": "Barbell Wrist Curl", "muscle": "Avant-bras", "equipment": "BB", "tips": { "setup": ["Avant-bras sur banc", "Poignets dans le vide"], "exec": ["Flexion du poignet vers le haut"], "mistake": ["Décoller les avant-bras"] } },
    { "id": "dumbbell_wrist_curl", "name": "Dumbbell Wrist Curl", "muscle": "Avant-bras", "equipment": "DB", "tips": { "setup": ["Unilatéral", "Avant-bras calé"], "exec": ["Enrouler le poignet"], "mistake": ["Mouvement trop rapide"] } },
    { "id": "rowing_machine", "name": "Rowing Machine", "muscle": "Cardio", "equipment": "EM", "tips": { "setup": ["Pieds sanglés", "Dos droit"], "exec": ["Poussée jambes -> Dos -> Bras", "Retour inverse"], "mistake": ["Arrondir le dos", "Tirer bras avant jambes"] } },
    { "id": "treadmill", "name": "Treadmill", "muscle": "Cardio", "equipment": "EM", "tips": { "setup": ["Chaussures adaptées"], "exec": ["Course ou marche inclinée"], "mistake": ["Se tenir aux poignées (réduit l'effort)"] } },
    { "id": "stationary_bike", "name": "Stationary Bike", "muscle": "Cardio", "equipment": "EM", "tips": { "setup": ["Selle hauteur hanche"], "exec": ["Pédalage fluide"], "mistake": ["Genoux qui rentrent", "Selle trop basse"] } }
];

const DEFAULT_PROGRAMS: Program[] = [
    {
      "id": "prog_phul_final",
      "name": "PHUL (Power Hypertrophy)",
      "sessions": [
        {
          "id": "sess_j1",
          "name": "UPPER A (Power)",
          "exos": [
            { "id": "dumbbell_bench_press", "sets": 4, "reps": "6-8", "rest": 180 },
            { "id": "pull_up", "sets": 4, "reps": "6-8", "rest": 180 },
            { "id": "dumbbell_seated_overhead_press", "sets": 3, "reps": "8-10", "rest": 120 },
            { "id": "seated_dumbbell_row", "sets": 3, "reps": "10-12", "rest": 90 },
            { "id": "bar_dip", "sets": 3, "reps": "10-12", "rest": 120 },
            { "id": "cable_pushdown", "sets": 3, "reps": "12-15", "rest": 60 },
            { "id": "ez_bar_curl", "sets": 3, "reps": "10-12", "rest": 90 },
            { "id": "barbell_wrist_curl", "sets": 3, "reps": "15-20", "rest": 60 }
          ]
        },
        {
          "id": "sess_j2",
          "name": "LOWER A (Power)",
          "exos": [
            { "id": "barbell_squat", "sets": 4, "reps": "6-8", "rest": 180 },
            { "id": "romanian_deadlift", "sets": 4, "reps": "8-10", "rest": 150 },
            { "id": "leg_press", "sets": 3, "reps": "10-12", "rest": 120 },
            { "id": "seated_leg_curl", "sets": 3, "reps": "12-15", "rest": 90 },
            { "id": "standing_calf_raise", "sets": 4, "reps": "12-15", "rest": 60 },
            { "id": "cable_woodchopper", "sets": 3, "reps": "15-20", "rest": 60 }
          ]
        },
        {
          "id": "sess_j4",
          "name": "UPPER B (Hypertrophy)",
          "exos": [
            { "id": "incline_dumbbell_press", "sets": 4, "reps": "10-12", "rest": 120 },
            { "id": "chin_up", "sets": 4, "reps": "10-12", "rest": 120 },
            { "id": "pec_deck", "sets": 3, "reps": "12-15", "rest": 60 },
            { "id": "cable_lateral_raise", "sets": 4, "reps": "15-20", "rest": 60 },
            { "id": "face_pull", "sets": 3, "reps": "15-20", "rest": 60 },
            { "id": "cable_overhead_triceps_extension", "sets": 3, "reps": "12-15", "rest": 90 },
            { "id": "dumbbell_hammer_curl", "sets": 3, "reps": "12-15", "rest": 90 },
            { "id": "weighted_sit_up", "sets": 3, "reps": "15-20", "rest": 60 }
          ]
        },
        {
          "id": "sess_j5",
          "name": "LOWER B (Hypertrophy)",
          "exos": [
            { "id": "dumbbell_bulgarian_split_squat", "sets": 4, "reps": "8-10", "rest": 120 },
            { "id": "hip_thrust", "sets": 4, "reps": "10-12", "rest": 120 },
            { "id": "leg_extension", "sets": 3, "reps": "12-15", "rest": 90 },
            { "id": "lying_leg_curl", "sets": 3, "reps": "12-15", "rest": 90 },
            { "id": "seated_calf_raise", "sets": 4, "reps": "15-20", "rest": 60 },
            { "id": "hanging_leg_raise", "sets": 3, "reps": "MAX", "rest": 60 },
            { "id": "barbell_wrist_curl", "sets": 3, "reps": "15-20", "rest": 60 }
          ]
        }
      ]
    }
  ];

const MUSCLE_COLORS: Record<string, string> = {
  'Pectoraux': '#58a6ff', 'Dos': '#3fb950', 'Jambes': '#d29922', 'Épaules': '#a371f7',
  'Bras': '#f85149', 'Abdos': '#00ffcc', 'Mollets': '#ff7b72', 'Avant-bras': '#79c0ff', 'Cardio': '#8b949e'
};

const getAccentStyle = (color: AccentColor) => {
  const theme = THEMES[color] || THEMES.blue;
  return { '--primary': theme.primary, '--primary-glow': theme.glow } as React.CSSProperties;
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[400] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-surface border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-6 border-b border-border flex justify-between items-center bg-surface2/20">
        <h3 className="text-xl font-black italic uppercase">{title}</h3>
        <button onClick={onClose} className="p-2 text-secondary hover:text-white transition-colors">✕</button>
      </div>
      <div className="p-6 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<View>(View.Dashboard);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [calDate, setCalDate] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);

  // States for Rest Timer & Modals
  const [restTime, setRestTime] = useState<number | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);
  const [showAddExoModal, setShowAddExoModal] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; subMessage?: string; onConfirm: () => void; variant?: 'danger' | 'primary' } | null>(null);
  
  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Library Editor State
  const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
  
  // Program Editor Pickers
  const [programExoPicker, setProgramExoPicker] = useState<number | null>(null); // sessionIdx
  
  // 1RM Calc State
  const [oneRMWeight, setOneRMWeight] = useState("100");
  const [oneRMReps, setOneRMReps] = useState("5");
  const est1RM = useMemo(() => calculate1RM(oneRMWeight, oneRMReps), [oneRMWeight, oneRMReps]);

  // Analytics State
  const [analyticsExo, setAnalyticsExo] = useState('global');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedDaySessions, setSelectedDaySessions] = useState<WorkoutSession[] | null>(null);

  // --- ANALYTICS DATA CALCULATION ---
  // ... (No change to analytics logic)
  const progData = useMemo(() => {
        let maxWeightSoFar = 0;
        return history.slice().reverse().map(s => {
          const ex = s.exercises.find(e => e.id === analyticsExo);
          if (!ex) return null;
          
          const doneSets = ex.sets.filter(st => st.done);
          if (doneSets.length === 0) return null;

          const bestSet = doneSets.reduce((prev, curr) => {
             return calculate1RM(curr.weight, curr.reps) > calculate1RM(prev.weight, prev.reps) ? curr : prev;
          });
          const bestSetE1RM = calculate1RM(bestSet.weight, bestSet.reps);

          const heaviestSet = doneSets.sort((a,b) => parseFloat(b.weight) - parseFloat(a.weight))[0];
          const heaviestWeight = parseFloat(heaviestSet.weight);
          
          if (heaviestWeight > maxWeightSoFar) maxWeightSoFar = heaviestWeight;
          
          return {
            date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            weight: heaviestWeight,
            e1rm: bestSetE1RM,
            pr: maxWeightSoFar
          };
        }).filter(d => d !== null);
  }, [history, analyticsExo]);

  const [weekStart, weekEnd] = useMemo(() => {
    const start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) + (currentWeekOffset * 7);
    start.setDate(diff);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return [start, end];
  }, [currentWeekOffset]);
    
  const volumeData = useMemo(() => {
        const counts: Record<string, number> = {};
        history.forEach(s => {
            const d = new Date(s.startTime);
            const dTime = d.setHours(0,0,0,0);
            const wStartTime = weekStart.setHours(0,0,0,0);
            const wEndTime = weekEnd.setHours(23,59,59,999);
            
            if (dTime >= wStartTime && dTime <= wEndTime) {
                s.exercises.forEach(e => {
                    const muscle = library.find(l => l.id === e.id)?.muscle || 'Autre';
                    const hardSets = e.sets.filter(st => {
                        if (!st.done) return false;
                        const rir = parseInt(st.rir || '10');
                        return rir <= 4;
                    }).length; 
                    counts[muscle] = (counts[muscle] || 0) + hardSets;
                });
            }
        });
        return Object.keys(MUSCLE_COLORS).map(m => ({ name: m, sets: counts[m] || 0 }));
  }, [history, weekStart, weekEnd, library]);

  const relativeData = useMemo(() => {
        const chronological = history.slice().sort((a,b) => a.startTime - b.startTime);
        
        let maxSquat = 0;
        let maxBench = 0;
        let maxDead = 0;

        return chronological.map(s => {
             s.exercises.forEach(e => {
                 const doneSets = e.sets.filter(st => st.done);
                 if (doneSets.length === 0) return;
                 const bestE1RM = Math.max(...doneSets.map(st => calculate1RM(st.weight, st.reps)));

                 if (e.id.includes('squat') || e.id.includes('leg_press')) maxSquat = Math.max(maxSquat, bestE1RM);
                 if (e.id.includes('bench') || e.id.includes('dips') || e.id.includes('press')) maxBench = Math.max(maxBench, bestE1RM);
                 if (e.id.includes('deadlift') || e.id.includes('pull_up') || e.id.includes('row')) maxDead = Math.max(maxDead, bestE1RM);
             });

             let strengthVal = 0;
             if (analyticsExo !== 'global') {
                 const ex = s.exercises.find(e => e.id === analyticsExo);
                 if (ex) {
                    const doneSets = ex.sets.filter(st => st.done);
                    if (doneSets.length > 0) strengthVal = Math.max(...doneSets.map(st => calculate1RM(st.weight, st.reps)));
                 }
             } else {
                 strengthVal = maxSquat + maxBench + maxDead;
             }

             const bw = parseFloat(s.bodyWeight) || 0;
             if (strengthVal === 0 && bw === 0) return null;
             
             return {
                 date: new Date(s.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
                 bw: bw > 0 ? bw : null,
                 strength: strengthVal > 0 ? strengthVal : null
             };
        }).filter(d => d !== null);
  }, [history, analyticsExo]);

  useEffect(() => {
    const l = localStorage.getItem(STORAGE_KEYS.LIB);
    const p = localStorage.getItem(STORAGE_KEYS.PROGS);
    const h = localStorage.getItem(STORAGE_KEYS.HIST);
    const s = localStorage.getItem(STORAGE_KEYS.SESS);
    const t = localStorage.getItem(STORAGE_KEYS.THEME) as AccentColor;

    if (l) setLibrary(JSON.parse(l)); else setLibrary(DEFAULT_LIBRARY);
    if (p) setPrograms(JSON.parse(p)); else setPrograms(DEFAULT_PROGRAMS);
    if (h) setHistory(JSON.parse(h));
    if (t) setAccentColor(t);
    if (s) {
      const active = JSON.parse(s);
      setSession(active);
      setView(View.Workout);
      setElapsed(Math.floor((Date.now() - active.startTime) / 1000));
    }
  }, []);

  // --- INSTALL PROMPT LISTENER ---
  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e as BeforeInstallPromptEvent);
      console.log("PWA Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HIST, JSON.stringify(history));
    localStorage.setItem(STORAGE_KEYS.PROGS, JSON.stringify(programs));
    localStorage.setItem(STORAGE_KEYS.LIB, JSON.stringify(library));
    localStorage.setItem(STORAGE_KEYS.THEME, accentColor);
  }, [history, programs, library, accentColor]);

  useEffect(() => {
    let interval: number;
    if (session) {
      interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - session.startTime) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    let timer: number;
    if (restTime !== null && restTime > 0) {
      timer = window.setInterval(() => setRestTime(prev => (prev && prev > 0) ? prev - 1 : 0), 1000);
    } else if (restTime === 0) {
      setRestTime(null);
    }
    return () => clearInterval(timer);
  }, [restTime]);

  const timerString = useMemo(() => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [elapsed]);

  const updateSet = (exoIdx: number, setIdx: number, field: keyof SetRecord, value: any) => {
    if (!session) return;
    const newSession = { ...session };
    const exo = newSession.exercises[exoIdx];
    const wasDone = exo.sets[setIdx].done;
    exo.sets[setIdx] = { ...exo.sets[setIdx], [field]: value };
    if (field === 'done' && value === true && !wasDone) {
      setRestTime(exo.rest);
    }
    setSession(newSession);
    localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify(newSession));
  };

  const handleDeleteExo = (id: string) => {
    const inHistory = history.some(s => s.exercises.some(e => e.id === id));
    const inProgs = programs.some(p => p.sessions.some(s => s.exos.some(e => e.id === id)));
    const message = "Supprimer l'exercice ?";
    const subMessage = (inHistory || inProgs) 
        ? "Attention : Cet exercice est utilisé dans l'historique ou des programmes. Sa suppression peut entraîner des erreurs d'affichage." 
        : "Action irréversible.";
    
    setPendingConfirm({
        message,
        subMessage,
        variant: 'danger',
        onConfirm: () => {
            setLibrary(prev => prev.filter(l => l.id !== id));
        }
    });
  };

  // --- RENDER METHODS (Unchanged except Settings) ---
  const renderDashboard = () => {
    const curMonth = calDate.getMonth();
    const curYear = calDate.getFullYear();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const firstDay = new Date(curYear, curMonth, 1).getDay();
    const emptyDays = firstDay === 0 ? 6 : firstDay - 1;

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <section className="bg-surface border border-border p-5 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={() => setCalDate(new Date(curYear, curMonth - 1))} className="p-3 text-primary text-2xl font-black">◀</button>
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">{calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => setCalDate(new Date(curYear, curMonth + 1))} className="p-3 text-primary text-2xl font-black">▶</button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['L','M','M','J','V','S','D'].map(d => <div key={d} className="text-center text-[9px] font-black text-secondary/40 mb-2">{d}</div>)}
            {Array.from({ length: emptyDays }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const daySessions = history.filter(s => {
                const d = new Date(s.startTime);
                return d.getDate() === day && d.getMonth() === curMonth && d.getFullYear() === curYear;
              });
              const count = daySessions.length;
              const intensity = count > 0 ? Math.min(100, daySessions.reduce((acc, s) => acc + s.exercises.length, 0) * 10) : 0;
              
              return (
                <button key={i} onClick={() => count > 0 && setSelectedDaySessions(daySessions)} className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-mono transition-all ${count > 0 ? 'border border-primary/20 shadow-lg' : 'text-secondary/30'}`} style={count > 0 ? { backgroundColor: `rgba(88, 166, 255, ${intensity/100 * 0.4 + 0.1})`, borderColor: 'var(--primary)' } : {}}>
                  <span className={count > 0 ? 'text-white font-bold' : ''}>{day}</span>
                  {count > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-[0_0_5px_var(--primary)]" />}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setView(View.Records)} className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-gold"><Icons.Records /></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Records</span>
          </button>
          <button onClick={() => setView(View.Analytics)} className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
            <span className="text-primary"><Icons.Analytics /></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Progrès</span>
          </button>
        </div>

        <button onClick={() => setView(View.Programs)} className="w-full py-6 bg-primary text-background font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase text-lg active:scale-95 transition-all">
          <Icons.Fitness /> Commencer
        </button>
      </div>
    );
  };

  const renderWorkout = () => {
      // (Code unchanged)
      if (!session) return null;
      return (
      <div className="space-y-6 pb-40 animate-in fade-in duration-500">
        <div className="flex justify-between items-start px-1">
           <button onClick={() => setPendingConfirm({
            message: "Annuler la séance ?",
            subMessage: "La progression actuelle sera perdue.",
            variant: "danger",
            onConfirm: () => { setSession(null); localStorage.removeItem(STORAGE_KEYS.SESS); setView(View.Dashboard); }
          })} className="p-2 text-danger/50 hover:text-danger"><span className="text-xl font-black">✕</span></button>
          <div className="flex-1 text-center">
            <h2 className="text-xl font-black italic uppercase leading-tight">{session.sessionName}</h2>
            <div className="text-secondary text-[10px] font-black uppercase tracking-widest">{session.programName}</div>
          </div>
          <button onClick={() => setPendingConfirm({
            message: "Terminer la séance ?",
            onConfirm: () => {
              const finished = { ...session, endTime: Date.now() };
              setHistory(prev => [finished, ...prev]);
              setSession(null);
              localStorage.removeItem(STORAGE_KEYS.SESS);
              setView(View.Dashboard);
            }
          })} className="px-6 py-3 bg-success text-white text-xs font-black rounded-full uppercase shadow-lg shadow-success/20">Finir</button>
        </div>

        <div className="bg-surface border border-border px-6 py-4 rounded-[2rem] flex items-center justify-between gap-4">
             <div className="flex-1 space-y-1">
                 <label className="text-[8px] font-black uppercase text-secondary">Poids de Corps (kg)</label>
                 <input type="number" value={session.bodyWeight} onChange={e => {setSession({...session, bodyWeight: e.target.value}); localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify({...session, bodyWeight: e.target.value}))}} className="w-full bg-background border border-border p-2 rounded-lg text-sm font-mono font-bold text-center focus:border-primary outline-none" placeholder="Ex: 80" />
             </div>
             <div className="flex-1 space-y-1">
                 <label className="text-[8px] font-black uppercase text-secondary">Fatigue (1-5)</label>
                 <input type="number" min="1" max="5" value={session.fatigue} onChange={e => {setSession({...session, fatigue: e.target.value}); localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify({...session, fatigue: e.target.value}))}} className="w-full bg-background border border-border p-2 rounded-lg text-sm font-mono font-bold text-center focus:border-primary outline-none" placeholder="3" />
             </div>
        </div>

        {session.exercises.map((exo, eIdx) => {
          const stats = getExerciseStats(exo.id, history);
          const libEx = library.find(l => l.id === exo.id);
          const bestSet = [...exo.sets].filter(s => s.done).sort((a,b) => calculate1RM(b.weight, b.reps) - calculate1RM(a.weight, a.reps))[0];
          const currentE1RM = bestSet ? calculate1RM(bestSet.weight, bestSet.reps) : 0;

          return (
            <div key={eIdx} className="bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-lg animate-in slide-in-from-bottom duration-300">
              <div className="p-6 border-b border-border bg-surface2/20">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-black italic uppercase leading-none">{libEx?.name || exo.id}</h3>
                        {libEx?.tips && (
                            <button onClick={() => setPendingConfirm({
                                message: libEx.name,
                                subMessage: [
                                    ...(libEx.tips.setup ? ["SETUP:", ...libEx.tips.setup] : []),
                                    ...(libEx.tips.exec ? ["EXEC:", ...libEx.tips.exec] : []),
                                    ...(libEx.tips.mistake ? ["ERREURS:", ...libEx.tips.mistake] : [])
                                ].join('\n'),
                                onConfirm: () => {}, variant: 'primary'
                            })} className="text-[10px] font-black bg-primary/20 text-primary px-1.5 rounded-full border border-primary/40">?</button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{libEx?.muscle || 'Muscle'}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gold/10 border border-gold/30 rounded-full">
                        <span className="text-[8px] font-black text-gold uppercase">Record Max:</span>
                        <span className="text-[10px] font-mono text-white font-bold">{stats.prMax}kg</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/30 rounded-full">
                        <span className="text-[8px] font-black text-primary uppercase">e1RM Actuel:</span>
                        <span className="text-[10px] font-mono text-white font-bold">{currentE1RM}kg</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => {
                    const newExos = [...session.exercises];
                    newExos.splice(eIdx, 1);
                    setSession({...session, exercises: newExos});
                  }} className="text-danger/40 p-2">✕</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-background/40 p-3 rounded-2xl border border-border/40">
                      <div className="text-[8px] font-black uppercase text-secondary mb-1">Dernière Séance</div>
                      <div className="text-[9px] font-mono text-secondary italic break-words">{stats.lastDetailed}</div>
                   </div>
                   <div className="bg-background/40 p-3 rounded-2xl border border-border/40 text-center">
                      <div className="text-[8px] font-black uppercase text-secondary mb-1">Delta vs Last e1RM</div>
                      <div className={`text-xs font-mono font-bold ${currentE1RM > stats.lastE1RM ? 'text-success' : 'text-danger'}`}>
                        {currentE1RM > stats.lastE1RM ? '+' : ''}{(currentE1RM - stats.lastE1RM).toFixed(1)}kg
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {exo.sets.map((set, sIdx) => (
                  <div key={sIdx} className={`p-4 rounded-2xl border transition-all ${set.done ? 'bg-success/5 border-success/30' : 'bg-surface2/40 border-transparent'}`}>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-[10px] font-mono font-bold text-secondary">{sIdx+1}</div>
                      <div className="col-span-3">
                        <input type="number" value={set.weight} onChange={e => updateSet(eIdx, sIdx, 'weight', e.target.value)} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-sm font-mono focus:border-primary outline-none" placeholder="kg" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" value={set.reps} onChange={e => updateSet(eIdx, sIdx, 'reps', e.target.value)} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-sm font-mono focus:border-primary outline-none" placeholder="reps" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" value={set.rir} onChange={e => updateSet(eIdx, sIdx, 'rir', e.target.value)} className="w-full bg-background border border-border text-center py-2.5 rounded-xl text-[10px] font-mono focus:border-primary outline-none" placeholder="RIR" />
                      </div>
                      <div className="col-span-3 flex gap-1">
                        <button onClick={() => updateSet(eIdx, sIdx, 'done', !set.done)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] transition-all ${set.done ? 'bg-success text-white' : 'bg-surface2 text-secondary border border-border'}`}>{set.done ? 'OK' : 'VAL'}</button>
                        <button onClick={() => {
                          const newExoSets = [...exo.sets];
                          newExoSets.splice(sIdx, 1);
                          const newExos = [...session.exercises];
                          newExos[eIdx].sets = newExoSets;
                          setSession({...session, exercises: newExos});
                        }} className="p-2.5 text-danger/40">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  const newExos = [...session.exercises];
                  const last = newExos[eIdx].sets[newExos[eIdx].sets.length-1];
                  newExos[eIdx].sets.push({ weight: last?.weight || "", reps: last?.reps || "", done: false, rir: last?.rir || "" });
                  setSession({...session, exercises: newExos});
                }} className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-[10px] font-black uppercase text-secondary hover:text-primary">+ Ajouter Série</button>
              </div>
            </div>
          );
        })}
        <button onClick={() => setShowAddExoModal(true)} className="w-full py-6 border-2 border-dashed border-border rounded-[2.5rem] text-secondary font-black uppercase">+ Mouvement</button>
      </div>
    );
  };
  const renderAnalytics = () => {
     // (Code unchanged)
     return (
      <div className="space-y-8 pb-32 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black italic uppercase">Analytics</h2>
        </div>

        {/* --- GRAPH 1: PROGRESSION --- */}
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black uppercase text-secondary tracking-widest">Progression & Records</h3>
            <select value={analyticsExo} onChange={e => setAnalyticsExo(e.target.value)} className="bg-background border border-border p-2 rounded-lg text-[9px] uppercase font-bold max-w-[120px]">
              <option value="global">Global (BW)</option>
              {Array.from(new Set(history.flatMap(s => s.exercises.map(e => e.id)))).map(id => (
                <option key={id} value={id}>{library.find(l => l.id === id)?.name || id}</option>
              ))}
            </select>
          </div>
          {analyticsExo !== 'global' ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={progData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                    <XAxis dataKey="date" stroke="#8b949e" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#8b949e" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="weight" name="Charge Effective" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={2} />
                    <Line type="monotone" dataKey="e1rm" name="e1RM" stroke="#ffffff" strokeDasharray="3 3" strokeWidth={2} dot={false} />
                    <Line type="stepAfter" dataKey="pr" name="Record Historique" stroke="#d29922" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
          ) : (
              <div className="text-center py-10 text-secondary text-xs">Sélectionnez un exercice pour voir la progression.</div>
          )}
        </div>

        {/* --- GRAPH 2: WEEKLY VOLUME --- */}
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-xl">
           <div className="flex justify-between items-center mb-6">
               <h3 className="text-[10px] font-black uppercase text-secondary tracking-widest">Sets par Semaine</h3>
               <div className="flex items-center gap-2 bg-background rounded-lg border border-border p-1">
                   <button onClick={() => setCurrentWeekOffset(prev => prev - 1)} className="px-2 text-primary font-black">◀</button>
                   <span className="text-[9px] font-mono">{weekStart.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'})} - {weekEnd.toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit'})}</span>
                   <button onClick={() => setCurrentWeekOffset(prev => prev + 1)} className="px-2 text-primary font-black">▶</button>
               </div>
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={volumeData} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                 <XAxis type="number" stroke="#8b949e" fontSize={10} axisLine={false} tickLine={false} />
                 <YAxis dataKey="name" type="category" stroke="#8b949e" fontSize={9} width={60} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }} itemStyle={{ color: '#c9d1d9' }} />
                 <ReferenceLine x={10} stroke="#238636" strokeDasharray="3 3" label={{ value: 'Maint.', position: 'top', fill:'#238636', fontSize: 8 }} />
                 <ReferenceLine x={20} stroke="#d29922" strokeDasharray="3 3" label={{ value: 'Max', position: 'top', fill:'#d29922', fontSize: 8 }} />
                 <Bar dataKey="sets" radius={[0, 4, 4, 0]}>
                    {volumeData.map((entry, index) => <Cell key={index} fill={MUSCLE_COLORS[entry.name] || '#8b949e'} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* --- GRAPH 3: RELATIVE STRENGTH --- */}
        <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-xl">
            <h3 className="text-[10px] font-black uppercase text-secondary mb-6 tracking-widest">Poids de Corps vs Force</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={relativeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis dataKey="date" stroke="#8b949e" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#8b949e" fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 9 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="var(--primary)" fontSize={10} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="bw" name="Poids de Corps" stroke="#8b949e" strokeWidth={2} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="strength" name={analyticsExo === 'global' ? "Total SBD / Max Force" : "Force (e1RM)"} stroke="var(--primary)" strokeWidth={2} dot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    );
  };
  const renderLibrary = () => (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black italic uppercase">Bibliothèque</h2>
        <button onClick={() => setView(View.Settings)} className="text-secondary text-xs uppercase font-black">Retour</button>
      </div>
      <div className="bg-surface border border-border p-6 rounded-[2.5rem] shadow-xl space-y-4">
        <button onClick={() => setEditingExercise({ id: "", name: "", muscle: "Pectoraux", equipment: "BB", tips: { setup: [], exec: [], mistake: [] } })} className="w-full py-4 bg-primary text-background font-black rounded-xl uppercase shadow-lg shadow-primary/20">+ Nouvel Exercice</button>
      </div>
      <div className="space-y-2">
        {library.map(l => (
          <div key={l.id} className="bg-surface border border-border p-5 rounded-2xl flex justify-between items-center group">
            <button onClick={() => setEditingExercise(l)} className="text-left flex-1">
              <div className="font-black uppercase text-white leading-none mb-1 italic group-hover:text-primary transition-colors">{l.name}</div>
              <span className="text-[8px] font-black uppercase text-secondary px-2 py-0.5 bg-surface2 rounded-full border border-border">{l.muscle}</span>
            </button>
            <button onClick={() => handleDeleteExo(l.id)} className="text-danger/40 hover:text-danger p-2">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
  const renderLibraryEditor = () => {
      // (Code unchanged)
      if (!editingExercise) return null;
    return (
        <Modal title={editingExercise.id ? "Modifier Exercice" : "Nouvel Exercice"} onClose={() => setEditingExercise(null)}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary">Nom</label>
                    <input value={editingExercise.name} onChange={e => setEditingExercise({...editingExercise, name: e.target.value})} className="w-full bg-surface2 border border-border p-3 rounded-xl font-bold text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-secondary">Muscle</label>
                         <select value={editingExercise.muscle} onChange={e => setEditingExercise({...editingExercise, muscle: e.target.value})} className="w-full bg-surface2 border border-border p-3 rounded-xl font-bold text-xs uppercase">
                            {Object.keys(MUSCLE_COLORS).map(m => <option key={m} value={m}>{m}</option>)}
                         </select>
                    </div>
                    <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-secondary">Équipement</label>
                         <select value={editingExercise.equipment} onChange={e => setEditingExercise({...editingExercise, equipment: e.target.value})} className="w-full bg-surface2 border border-border p-3 rounded-xl font-bold text-xs uppercase">
                            {['BW','BB','DB','RC','EM','EZ','Plate', 'Bench', 'TB'].map(eq => <option key={eq} value={eq}>{eq}</option>)}
                         </select>
                    </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-border/50">
                    <p className="text-[10px] font-black uppercase text-primary">Conseils (Un par ligne)</p>
                    {['setup', 'exec', 'mistake'].map((type) => (
                        <div key={type} className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-secondary">{type === 'setup' ? 'Mise en place' : type === 'exec' ? 'Exécution' : 'Erreurs'}</label>
                            <textarea 
                                value={editingExercise.tips?.[type as keyof typeof editingExercise.tips]?.join('\n') || ""} 
                                onChange={e => {
                                    const lines = e.target.value.split('\n');
                                    setEditingExercise({
                                        ...editingExercise, 
                                        tips: { ...editingExercise.tips, [type]: lines }
                                    });
                                }}
                                className="w-full bg-surface2/50 border border-border p-3 rounded-xl text-xs font-mono h-20"
                                placeholder={`Liste des points pour ${type}...`}
                            />
                        </div>
                    ))}
                </div>

                <button onClick={() => {
                    if (!editingExercise.name) return;
                    let newLib = [...library];
                    if (editingExercise.id) {
                        // Edit existing
                        const idx = newLib.findIndex(l => l.id === editingExercise.id);
                        if (idx >= 0) newLib[idx] = editingExercise;
                    } else {
                        // Create new
                        const newId = editingExercise.name.toLowerCase().replace(/\s+/g, '_');
                        newLib.push({ ...editingExercise, id: newId });
                    }
                    setLibrary(newLib);
                    setEditingExercise(null);
                }} className="w-full py-4 bg-primary text-background font-black rounded-xl uppercase shadow-lg shadow-primary/20">Enregistrer</button>
            </div>
        </Modal>
    );
  };
  const renderEditorProgram = () => {
      // (Code unchanged)
      if (!editingProgram) return null;

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black italic uppercase">Éditeur</h2>
          <div className="flex gap-2">
              <button onClick={() => { setEditingProgram(null); setView(View.Programs); }} className="bg-danger text-white px-6 py-2 rounded-full text-[10px] font-black uppercase shadow-lg shadow-danger/20">Annuler</button>
              <button onClick={() => {
                  // Save
                  if (!editingProgram.name) return;
                  const newProgs = programs.filter(p => p.id !== editingProgram.id);
                  setPrograms([...newProgs, editingProgram]);
                  setEditingProgram(null);
                  setView(View.Programs);
              }} className="bg-success text-white px-6 py-2 rounded-full text-[10px] font-black uppercase shadow-lg shadow-success/20">Sauvegarder</button>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-[2.5rem] space-y-4">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-secondary">Nom du Programme</label>
              <input value={editingProgram.name} onChange={e => setEditingProgram({...editingProgram, name: e.target.value})} className="w-full bg-surface2 border border-border p-4 rounded-xl font-bold text-white focus:border-primary outline-none transition-colors" placeholder="Nom..." />
           </div>
        </div>

        <div className="space-y-4">
           {editingProgram.sessions.map((sess, sIdx) => (
             <div key={sess.id} className="bg-surface border border-border p-6 rounded-[2.5rem] relative">
                <button onClick={() => {
                    const newSess = [...editingProgram.sessions];
                    newSess.splice(sIdx, 1);
                    setEditingProgram({...editingProgram, sessions: newSess});
                }} className="absolute top-6 right-6 text-danger/40 hover:text-danger p-2">✕</button>
                
                <div className="mb-6 pr-10 space-y-2">
                    <label className="text-[10px] font-black uppercase text-secondary">Nom Séance</label>
                    <input value={sess.name} onChange={e => {
                        const newSess = [...editingProgram.sessions];
                        newSess[sIdx].name = e.target.value;
                        setEditingProgram({...editingProgram, sessions: newSess});
                    }} className="w-full bg-surface2/50 border border-border p-3 rounded-xl font-bold text-sm text-white focus:border-primary outline-none" />
                </div>

                <div className="space-y-3">
                    {sess.exos.map((ex, eIdx) => (
                        <div key={eIdx} className="bg-surface2/30 p-4 rounded-2xl border border-border/50">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-black uppercase italic text-primary">{library.find(l => l.id === ex.id)?.name || ex.id}</span>
                                <button onClick={() => {
                                    const newSess = [...editingProgram.sessions];
                                    newSess[sIdx].exos.splice(eIdx, 1);
                                    setEditingProgram({...editingProgram, sessions: newSess});
                                }} className="text-danger/40 text-[10px]">✕</button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-secondary">Sets</label>
                                    <input type="number" value={ex.sets} onChange={e => {
                                        const newSess = [...editingProgram.sessions];
                                        newSess[sIdx].exos[eIdx].sets = parseInt(e.target.value) || 0;
                                        setEditingProgram({...editingProgram, sessions: newSess});
                                    }} className="w-full bg-background border border-border p-2 rounded-lg text-center text-xs font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-secondary">Reps</label>
                                    <input value={ex.reps} onChange={e => {
                                        const newSess = [...editingProgram.sessions];
                                        newSess[sIdx].exos[eIdx].reps = e.target.value;
                                        setEditingProgram({...editingProgram, sessions: newSess});
                                    }} className="w-full bg-background border border-border p-2 rounded-lg text-center text-xs font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-secondary">RIR</label>
                                    <input value={ex.targetRir || ""} onChange={e => {
                                        const newSess = [...editingProgram.sessions];
                                        newSess[sIdx].exos[eIdx].targetRir = e.target.value;
                                        setEditingProgram({...editingProgram, sessions: newSess});
                                    }} className="w-full bg-background border border-border p-2 rounded-lg text-center text-xs font-mono" placeholder="2" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-secondary">Rest(s)</label>
                                    <input type="number" value={ex.rest} onChange={e => {
                                        const newSess = [...editingProgram.sessions];
                                        newSess[sIdx].exos[eIdx].rest = parseInt(e.target.value) || 0;
                                        setEditingProgram({...editingProgram, sessions: newSess});
                                    }} className="w-full bg-background border border-border p-2 rounded-lg text-center text-xs font-mono" />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setProgramExoPicker(sIdx)} className="w-full py-3 border border-dashed border-border rounded-xl text-[10px] font-black uppercase text-secondary hover:text-primary hover:border-primary transition-all">+ Exercice</button>
                </div>
             </div>
           ))}
           <button onClick={() => setEditingProgram({...editingProgram, sessions: [...editingProgram.sessions, { id: Date.now().toString(), name: "Nouvelle Séance", exos: [] }]})} className="w-full py-6 bg-surface2 border border-border rounded-[2.5rem] text-xs font-black uppercase text-secondary hover:text-white transition-all">+ Ajouter Séance</button>
        </div>

        {programExoPicker !== null && (
            <Modal title="Choisir un exercice" onClose={() => setProgramExoPicker(null)}>
                <div className="space-y-2">
                    {library.map(l => (
                        <button key={l.id} onClick={() => {
                            const newSess = [...editingProgram.sessions];
                            newSess[programExoPicker].exos.push({ id: l.id, sets: 3, reps: "8-12", rest: 120, targetRir: "2" });
                            setEditingProgram({...editingProgram, sessions: newSess});
                            setProgramExoPicker(null);
                        }} className="w-full p-4 bg-surface2/50 hover:bg-primary/10 border border-border hover:border-primary rounded-xl text-left transition-all">
                            <div className="font-black uppercase text-xs text-white">{l.name}</div>
                            <div className="text-[9px] font-bold text-secondary">{l.muscle}</div>
                        </button>
                    ))}
                </div>
            </Modal>
        )}
      </div>
    );
  };
  const renderOneRMCalc = () => {
    // (Code unchanged)
    return (
       <div className="space-y-6 pb-24 animate-in fade-in duration-500">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-2xl font-black italic uppercase">Calculateur 1RM</h2>
            <button onClick={() => setView(View.Records)} className="text-secondary text-xs uppercase font-black">Retour</button>
          </div>
          
          <div className="bg-surface border border-border p-8 rounded-[2.5rem] shadow-xl text-center space-y-6">
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-secondary">Poids (kg)</label>
                     <input type="number" value={oneRMWeight} onChange={e => setOneRMWeight(e.target.value)} className="w-full bg-background border border-border p-4 rounded-2xl text-center text-xl font-mono font-bold focus:border-primary outline-none" />
                 </div>
                 <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-secondary">Reps</label>
                     <input type="number" value={oneRMReps} onChange={e => setOneRMReps(e.target.value)} className="w-full bg-background border border-border p-4 rounded-2xl text-center text-xl font-mono font-bold focus:border-primary outline-none" />
                 </div>
             </div>
             
             <div className="py-8 border-y border-border/50">
                 <div className="text-[10px] font-black uppercase text-secondary tracking-widest mb-2">Estimation 1RM</div>
                 <div className="text-6xl font-black text-primary drop-shadow-[0_0_15px_var(--primary-glow)] font-mono">{est1RM}<span className="text-2xl ml-2 text-secondary">kg</span></div>
             </div>

             <div className="grid grid-cols-3 gap-3">
                 {[95, 90, 85, 80, 75, 70].map(pct => (
                     <div key={pct} className="bg-surface2/30 p-3 rounded-xl border border-border/50">
                         <div className="text-[9px] font-black text-secondary">{pct}%</div>
                         <div className="font-mono font-bold text-white">{Math.round(est1RM * (pct/100))}kg</div>
                     </div>
                 ))}
             </div>
          </div>
       </div>
    );
  };

  return (
    <div className="min-h-screen pb-safe bg-background text-white font-sans" style={getAccentStyle(accentColor)}>
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_var(--primary-glow)]"><Icons.Fitness /></div>
          <h1 className="text-lg font-black italic uppercase tracking-tighter">Iron <span className="text-primary">V10</span></h1>
        </div>
        {session && (
          <div className="bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_5px_var(--primary)]" />
            <span className="text-xs font-mono font-black text-primary">{timerString}</span>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4 pt-8">
        {view === View.Dashboard && renderDashboard()}
        {view === View.Workout && renderWorkout()}
        {view === View.Programs && (
          <div className="space-y-6 pb-24 animate-in fade-in duration-500">
             <div className="flex justify-between items-center px-1">
                <h2 className="text-2xl font-black italic uppercase">Mes Routines</h2>
                <button onClick={() => { setEditingProgram({ id: Date.now().toString(), name: "Nouveau Programme", sessions: [] }); setView(View.EditorProgram); }} className="text-primary font-bold text-[10px] uppercase bg-primary/10 px-4 py-2 rounded-full">+ Nouveau</button>
             </div>
             {programs.map(p => (
               <div key={p.id} className="bg-surface border border-border p-6 rounded-[2.5rem] space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">{p.name}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => { setEditingProgram(JSON.parse(JSON.stringify(p))); setView(View.EditorProgram); }} className="text-primary p-2 bg-primary/10 rounded-full"><Icons.Settings /></button>
                        <button onClick={() => setPendingConfirm({
                            message: `Supprimer ${p.name} ?`,
                            variant: 'danger',
                            onConfirm: () => setPrograms(programs.filter(pr => pr.id !== p.id))
                        })} className="text-danger p-2 bg-danger/10 rounded-full">✕</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {p.sessions.map(s => (
                      <button key={s.id} onClick={() => setPreviewProgram(p)} className="p-4 bg-surface2/50 border border-border rounded-2xl text-left hover:border-primary flex justify-between items-center transition-all">
                        <span className="text-xs font-black uppercase text-white">{s.name}</span>
                        <span className="text-primary">➔</span>
                      </button>
                    ))}
                  </div>
               </div>
             ))}
          </div>
        )}
        {view === View.EditorProgram && renderEditorProgram()}
        {view === View.Records && (
          <div className="space-y-6 pb-24 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-2xl font-black italic uppercase px-1">Records Perso</h2>
                <button onClick={() => setView(View.OneRMCalculator)} className="text-primary font-bold text-[10px] uppercase bg-primary/10 px-4 py-2 rounded-full active:scale-95 transition-all">Calculateur 1RM</button>
            </div>
            <div className="bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-surface2/50 text-[9px] font-black uppercase text-secondary border-b border-border">
                  <tr><th className="p-5">Exercice</th><th className="p-5">Record Max</th><th className="p-5">e1RM</th></tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono text-xs">
                  {Array.from(new Set(history.flatMap(s => s.exercises.map(e => e.id)))).map(id => {
                    const stats = getExerciseStats(id, history);
                    return (
                      <tr key={id} className="hover:bg-primary/5">
                        <td className="p-5 font-black uppercase italic text-white">{library.find(l => l.id === id)?.name || id}</td>
                        <td className="p-5 text-gold font-bold">{stats.prMax}kg</td>
                        <td className="p-5 text-primary font-bold">{stats.pr}kg</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {view === View.OneRMCalculator && renderOneRMCalc()}
        {view === View.Analytics && renderAnalytics()}
        {view === View.Settings && (
          <div className="space-y-8 pb-24">
             <h2 className="text-2xl font-black italic uppercase px-1">Réglages</h2>
             <div className="bg-surface border border-border rounded-[2.5rem] overflow-hidden">
                <div className="p-6 border-b border-border bg-surface2/30 flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase text-secondary">Thème Visuel</span>
                   <div className="flex gap-2">
                     {(Object.keys(THEMES) as AccentColor[]).map(c => (
                       <button key={c} onClick={() => setAccentColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${accentColor === c ? 'scale-125 border-white' : 'border-transparent'}`} style={{ backgroundColor: THEMES[c].primary }} />
                     ))}
                   </div>
                </div>
                <div className="p-8 space-y-4">
                  {/* INSTALL BUTTON */}
                  {installPrompt && (
                    <button onClick={() => {
                        installPrompt.prompt();
                        installPrompt.userChoice.then((choiceResult: any) => {
                           if (choiceResult.outcome === 'accepted') {
                               setInstallPrompt(null);
                           }
                        });
                    }} className="w-full py-5 bg-gradient-to-r from-primary to-cyan1rm text-background rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-primary/20 animate-pulse">
                        Installer l'application
                    </button>
                  )}
                  
                  <button onClick={() => setView(View.Library)} className="w-full py-5 bg-surface2 rounded-2xl font-black uppercase text-[10px] border border-border hover:border-primary transition-all">Gérer la Bibliothèque</button>
                  <button onClick={() => setPendingConfirm({
                      message: "Vider l'historique ?",
                      subMessage: "Action irréversible.",
                      variant: 'danger',
                      onConfirm: () => setHistory([])
                  })} className="w-full py-5 border border-danger/30 text-danger rounded-2xl font-black uppercase text-[10px] hover:bg-danger/10 transition-all">Vider l'historique</button>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button onClick={() => downloadFile({ library, history, programs }, 'iron_export.json')} className="py-4 bg-surface2/50 border border-border rounded-xl text-[9px] font-black uppercase">Exporter Data</button>
                    <label className="py-4 bg-surface2/50 border border-border rounded-xl text-[9px] font-black uppercase text-center cursor-pointer">
                      Importer Data
                      <input type="file" className="hidden" onChange={e => {
                         const file = e.target.files?.[0]; if (!file) return;
                         const reader = new FileReader();
                         reader.onload = (ev) => { try {
                           const d = JSON.parse(ev.target?.result as string);
                           if (d.library) setLibrary(d.library);
                           if (d.history) setHistory(d.history);
                           if (d.programs) setPrograms(d.programs);
                         } catch(err) { alert("JSON Invalide"); } };
                         reader.readAsText(file);
                      }} />
                    </label>
                  </div>
                </div>
             </div>
          </div>
        )}
        {view === View.Library && renderLibrary()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto bg-surface/80 backdrop-blur-2xl border border-white/5 rounded-full p-2 shadow-2xl flex justify-between relative overflow-hidden">
          {[
            { v: View.Dashboard, i: <Icons.Dashboard />, l: 'Home' },
            { v: View.Programs, i: <Icons.Programs />, l: 'Progs' },
            { v: session ? View.Workout : View.Records, i: session ? <Icons.Workout /> : <Icons.Records />, l: session ? 'Session' : 'Records' },
            { v: View.Analytics, i: <Icons.Analytics />, l: 'Stats' },
            { v: View.Settings, i: <Icons.Settings />, l: 'Set' }
          ].map(item => (
            <button key={item.v} onClick={() => setView(item.v)} className={`flex-1 flex flex-col items-center py-2 transition-all relative z-10 ${view === item.v ? 'text-primary' : 'text-secondary/50'}`}>
              <span className={`transition-transform duration-300 ${view === item.v ? 'scale-110 -translate-y-1' : 'scale-100'}`}>{item.i}</span>
              <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.l}</span>
              {view === item.v && <div className="absolute inset-x-4 bottom-0 h-1 bg-primary rounded-full shadow-[0_0_10px_var(--primary-glow)]" />}
            </button>
          ))}
        </div>
      </nav>

      {/* REST TIMER & OTHER MODALS ... (Unchanged) */}
      {restTime !== null && (
        <div className="fixed inset-0 z-[300] bg-background/90 backdrop-blur-xl flex items-center justify-center animate-in zoom-in-95 duration-300">
           <div className="text-center space-y-8 max-w-xs w-full">
              <div className="text-[10px] font-black uppercase text-secondary tracking-widest animate-pulse">Temps de Repos</div>
              <div className="relative flex items-center justify-center">
                 <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="4" strokeDasharray={282} strokeDashoffset={282 - (282 * (restTime / 120))} strokeLinecap="round" className="transition-all" style={{ filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
                 </svg>
                 <span className="absolute font-mono text-5xl font-black text-primary drop-shadow-[0_0_15px_var(--primary-glow)]">{restTime}s</span>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setRestTime(prev => (prev || 0) + 15)} className="flex-1 py-4 bg-surface2 border border-border rounded-2xl font-black text-xs uppercase active:scale-95 transition-all">+15s</button>
                 <button onClick={() => setRestTime(null)} className="flex-1 py-4 bg-primary text-background rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Passer</button>
              </div>
           </div>
        </div>
      )}
      
      {/* ... (Previous Modals: selectedDaySessions, previewProgram, showAddExoModal, pendingConfirm, etc.) */}
      
      {selectedDaySessions && (
          <Modal title="Séances du Jour" onClose={() => setSelectedDaySessions(null)}>
              <div className="space-y-4">
                  {selectedDaySessions.map(s => (
                      <div key={s.id} className="bg-surface2/40 p-5 rounded-[2rem] border border-border/50">
                          <h4 className="text-lg font-black italic uppercase text-primary mb-1">{s.sessionName} <span className="text-secondary text-xs font-normal normal-case ml-2">({s.endTime ? Math.round((s.endTime - s.startTime)/60000) : '?'} min)</span></h4>
                          <p className="text-xs text-secondary uppercase tracking-widest mb-4">{s.programName}</p>
                          <div className="space-y-2">
                              {s.exercises.map((e, i) => {
                                  // Format compact inline for calendar
                                  const doneSets = e.sets.filter(x => x.done);
                                  const weights = doneSets.map(x => x.weight).join(',');
                                  const reps = doneSets.map(x => x.reps).join(',');
                                  const rirs = doneSets.map(x => x.rir || '-').join(',');
                                  
                                  return (
                                    <div key={i} className="flex flex-col text-xs border-l-2 border-primary/20 pl-3 mb-2">
                                        <span className="text-white font-bold">{library.find(l => l.id === e.id)?.name || e.id}</span>
                                        {doneSets.length > 0 ? (
                                           <span className="font-mono text-secondary text-[10px] mt-0.5">{weights}kg x {reps} | RIR {rirs}</span>
                                        ) : (
                                           <span className="text-secondary/50 text-[10px]">-</span>
                                        )}
                                    </div>
                                  )
                              })}
                          </div>
                      </div>
                  ))}
              </div>
          </Modal>
      )}

      {previewProgram && (
        <Modal title={previewProgram.name} onClose={() => setPreviewProgram(null)}>
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-secondary tracking-widest border-b border-border/50 pb-2">Aperçu des séances</p>
            {previewProgram.sessions.map(s => (
              <div key={s.id} className="bg-surface2/40 p-5 rounded-[2rem] border border-border/50 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-black uppercase text-primary italic">{s.name}</span>
                  <button onClick={() => {
                    const newS: WorkoutSession = {
                      id: Date.now(),
                      programName: previewProgram.name,
                      sessionName: s.name,
                      startTime: Date.now(),
                      bodyWeight: history[0]?.bodyWeight || "",
                      fatigue: "3",
                      exercises: s.exos.map(e => ({
                        id: e.id, target: e.reps, rest: e.rest, isBonus: false, notes: "",
                        sets: Array.from({ length: e.sets }).map(() => ({ weight: "", reps: "", done: false, rir: e.targetRir || "" }))
                      }))
                    };
                    setSession(newS);
                    setView(View.Workout);
                    setPreviewProgram(null);
                    localStorage.setItem(STORAGE_KEYS.SESS, JSON.stringify(newS));
                  }} className="bg-primary text-background px-6 py-2 rounded-full text-[10px] font-black uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all">Lancer</button>
                </div>
                <div className="space-y-3">
                  {s.exos.map((e, idx) => (
                    <div key={idx} className="text-[10px] text-secondary flex justify-between items-center border-l-2 border-primary/30 pl-3">
                      <span className="font-bold text-white uppercase">{library.find(l => l.id === e.id)?.name || e.id}</span>
                      <span className="font-mono text-primary">{e.sets}x{e.reps} (RIR {e.targetRir || "2"})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showAddExoModal && (
        <Modal title="Ajouter un mouvement" onClose={() => setShowAddExoModal(false)}>
           <div className="space-y-2">
              {library.map(l => (
                <button key={l.id} onClick={() => {
                  if (!session) return;
                  const newExo: ExerciseInstance = { id: l.id, target: "8-12", rest: 90, isBonus: true, notes: "", sets: [{ weight: "", reps: "", done: false, rir: "2" }] };
                  setSession({...session, exercises: [...session.exercises, newExo]});
                  setShowAddExoModal(false);
                }} className="w-full p-6 bg-surface2/60 hover:bg-primary/10 border border-border hover:border-primary rounded-[1.5rem] flex justify-between items-center text-left transition-all group">
                  <div>
                    <div className="font-black italic uppercase text-lg leading-none mb-1 group-hover:text-primary transition-colors">{l.name}</div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-surface2 text-secondary">{l.muscle}</span>
                  </div>
                  <span className="text-primary text-2xl font-black group-hover:scale-125 transition-transform">+</span>
                </button>
              ))}
           </div>
        </Modal>
      )}

      {editingExercise && renderLibraryEditor()}

      {pendingConfirm && (
        <div className="fixed inset-0 z-[500] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-8 rounded-[2.5rem] max-w-xs w-full text-center shadow-2xl animate-in zoom-in-90">
            <h3 className="text-lg font-black uppercase mb-2">{pendingConfirm.message}</h3>
            {pendingConfirm.subMessage && <p className="text-xs text-secondary mb-6 whitespace-pre-line">{pendingConfirm.subMessage}</p>}
            <div className="flex flex-col gap-3">
              <button onClick={() => { pendingConfirm.onConfirm(); setPendingConfirm(null); }} className={`w-full py-4 rounded-2xl font-black uppercase text-xs shadow-lg transition-all active:scale-95 ${pendingConfirm.variant === 'danger' ? 'bg-danger text-white' : 'bg-primary text-background'}`}>Confirmer</button>
              <button onClick={() => setPendingConfirm(null)} className="w-full py-4 bg-surface2 text-secondary rounded-2xl font-black uppercase text-xs active:scale-95 transition-all">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}