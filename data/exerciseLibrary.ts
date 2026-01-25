
import { LibraryExercise } from '../types';

export const DEFAULT_LIBRARY: LibraryExercise[] = [
    // PECTORAUX
    {
      "id": "barbell_bench_press",
      "name": "Barbell Bench Press",
      "type": "Polyarticulaire",
      "muscle": "Pectoraux",
      "equipment": "BB",
      "tips": { "setup": ["Omoplates serrées (rétraction)", "Pieds ancrés au sol", "Dos cambré (arc naturel)"], "exec": ["Barre sur bas des pecs", "Coudes à 45° du corps", "Pousser en gardant les épaules collées"], "mistake": ["Décoller les fesses", "Rebondir sur la poitrine"] }
    },
    {
      "id": "dumbbell_bench_press",
      "name": "Dumbbell Bench Press",
      "type": "Polyarticulaire",
      "muscle": "Pectoraux",
      "equipment": "DB",
      "tips": { "setup": ["Banc à plat", "Pieds stables au sol"], "exec": ["Descendre haltères niveau poitrine", "Trajectoire légèrement convergente"], "mistake": ["Coudes trop écartés (90°)", "Manque de stabilité"] }
    },
    {
      "id": "incline_bench_press",
      "name": "Incline Bench Press",
      "type": "Polyarticulaire",
      "muscle": "Pectoraux",
      "equipment": "BB",
      "tips": { "setup": ["Banc incliné 30-45°", "Omoplates serrées"], "exec": ["Toucher le haut des pecs (clavicules)", "Extension complète"], "mistake": ["Banc trop incliné (épaules dominantes)", "Dos décollé"] }
    },
    {
      "id": "incline_dumbbell_press",
      "name": "Incline Dumbbell Press",
      "type": "Polyarticulaire",
      "muscle": "Pectoraux",
      "equipment": "DB",
      "tips": { "setup": ["Banc 30°", "Poitrine sortie"], "exec": ["Pousser vers le plafond", "Contrôler la descente"], "mistake": ["Coudes trop ouverts", "Amplitude réduite"] }
    },
    {
      "id": "machine_chest_press",
      "name": "Machine Chest Press",
      "type": "Polyarticulaire",
      "muscle": "Pectoraux",
      "equipment": "EM",
      "tips": { "setup": ["Poignées au niveau mi-pecs"], "exec": ["Pousser sans décoller le dos"], "mistake": ["Coudes trop hauts"] }
    },
    {
      "id": "bar_dip",
      "name": "Bar Dip",
      "type": "Polyarticulaire",
      "muscle": "Pectoraux",
      "equipment": "BW",
      "tips": { "setup": ["Buste penché en avant (focus pecs)", "Jambes croisées"], "exec": ["Descendre jusqu'à l'étirement confortable", "Pousser"], "mistake": ["Descendre trop bas (danger épaules)", "Rester trop droit (focus triceps)"] }
    },
    {
      "id": "push_up",
      "name": "Push-Up",
      "type": "Polyarticulaire",
      "muscle": "Pectoraux",
      "equipment": "BW",
      "tips": { "setup": ["Mains largeur épaules", "Corps aligné"], "exec": ["Poitrine au sol", "Extension complète"], "mistake": ["Hanches qui tombent", "Coudes à 90° (T)"] }
    },
    {
      "id": "pec_deck",
      "name": "Pec Deck",
      "type": "Isolation",
      "muscle": "Pectoraux",
      "equipment": "EM",
      "tips": { "setup": ["Siège réglé pour bras // au sol", "Dos plaqué"], "exec": ["Resserrer les coudes/mains devant", "Contraction 1s"], "mistake": ["Décoller le dos", "Utiliser l'élan"] }
    },
    {
      "id": "dumbbell_chest_fly",
      "name": "Dumbbell Chest Fly",
      "type": "Isolation",
      "muscle": "Pectoraux",
      "equipment": "DB",
      "tips": { "setup": ["Banc plat", "Coudes légèrement fléchis"], "exec": ["Ouvrir les bras en arc de cercle", "Ressentir l'étirement"], "mistake": ["Tendre les bras complètement", "Aller trop lourd"] }
    },
    {
      "id": "standing_cable_chest_fly",
      "name": "Standing Cable Chest Fly",
      "type": "Isolation",
      "muscle": "Pectoraux",
      "equipment": "CB",
      "tips": { "setup": ["Un pied devant pour l'équilibre", "Buste penché"], "exec": ["Amener les poignées devant le nombril", "Serrer les pecs"], "mistake": ["Épaules qui remontent", "Balancier du corps"] }
    },

    // ÉPAULES
    {
      "id": "dumbbell_shoulder_press",
      "name": "Dumbbell Shoulder Press",
      "type": "Polyarticulaire",
      "muscle": "Épaules",
      "equipment": "DB",
      "tips": { "setup": ["Debout ou assis", "Abdos gainés"], "exec": ["Pousser verticalement", "Ne pas claquer les haltères"], "mistake": ["Cambrer le dos excessivement"] }
    },
    {
      "id": "barbell_overhead_press",
      "name": "Barbell Overhead Press",
      "type": "Polyarticulaire",
      "muscle": "Épaules",
      "equipment": "BB",
      "tips": { "setup": ["Gainage abdos/fessiers fort", "Prise largeur épaules"], "exec": ["Trajectoire verticale (tête s'efface)", "Extension complète"], "mistake": ["Pousser vers l'avant", "S'aider des jambes (Push Press)"] }
    },
    {
      "id": "arnold_press",
      "name": "Arnold Press",
      "type": "Polyarticulaire",
      "muscle": "Épaules",
      "equipment": "DB",
      "tips": { "setup": ["Haltères devant, paumes vers soi"], "exec": ["Rotation en poussant", "Finir paumes vers l'avant"], "mistake": ["Manque de fluidité", "Charge trop lourde"] }
    },
    {
      "id": "hspu",
      "name": "Handstand Push-Up",
      "type": "Polyarticulaire",
      "muscle": "Épaules",
      "equipment": "BW",
      "tips": { "setup": ["Mains largeur épaules", "Corps gainé en équilibre"], "exec": ["Descendre tête au sol (triangle)", "Pousser fort"], "mistake": ["Dos cambré (Banane)", "Coudes trop écartés"] }
    },
    {
      "id": "dumbbell_lateral_raise",
      "name": "Dumbbell Lateral Raise",
      "type": "Isolation",
      "muscle": "Épaules",
      "equipment": "DB",
      "tips": { "setup": ["Buste très légèrement penché", "Genoux fléchis"], "exec": ["Lever avec les coudes", "Pas plus haut que l'épaule"], "mistake": ["Utiliser l'élan (swing)", "Monter les trapèzes"] }
    },
    {
      "id": "cable_lateral_raise",
      "name": "Cable Lateral Raise",
      "type": "Isolation",
      "muscle": "Épaules",
      "equipment": "CB",
      "tips": { "setup": ["Poulie basse", "Main opposée"], "exec": ["Tirer sur le côté", "Mouvement fluide"], "mistake": ["Acoups", "Rotation du buste"] }
    },
    {
      "id": "face_pull",
      "name": "Face Pull",
      "type": "Isolation",
      "muscle": "Épaules",
      "equipment": "CB",
      "tips": { "setup": ["Poulie hauteur visage", "Prise neutre"], "exec": ["Tirer vers le front/oreilles", "Rotation externe en fin"], "mistake": ["Aller trop lourd", "Tirer avec les biceps"] }
    },
    {
      "id": "reverse_pec_deck",
      "name": "Reverse Pec Deck",
      "type": "Isolation",
      "muscle": "Épaules",
      "equipment": "EM",
      "tips": { "setup": ["Face à la machine", "Bras tendus"], "exec": ["Ouvrir les bras vers l'arrière", "Focus arrière d'épaule"], "mistake": ["Plier les bras", "Creuser le dos"] }
    },
    {
      "id": "reverse_dumbbell_fly",
      "name": "Reverse Dumbbell Fly",
      "type": "Isolation",
      "muscle": "Épaules",
      "equipment": "DB",
      "tips": { "setup": ["Buste // au sol", "Dos plat"], "exec": ["Lever les bras sur le côté", "Omoplates fixes"], "mistake": ["Relever le buste", "Élan"] }
    },
    
    // DOS
    {
      "id": "barbell_deadlift",
      "name": "Deadlift",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "BB",
      "tips": { "setup": ["Pieds largeur hanches", "Barre au dessus des lacets"], "exec": ["Pousser le sol (Jambes) puis tirer (Dos)", "Barre longe les tibias"], "mistake": ["Dos rond", "Tirer avec les bras"] }
    },
    {
      "id": "pull_up",
      "name": "Pull-Up",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "BW",
      "tips": { "setup": ["Prise pronation large", "Corps gainé"], "exec": ["Amener le menton au dessus de la barre", "Contrôler la descente"], "mistake": ["Kipping (élan)", "Amplitude partielle", "Épaules aux oreilles"] }
    },
    {
      "id": "chin_up",
      "name": "Chin-Up",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "BW",
      "tips": { "setup": ["Prise supination (paumes vers soi)"], "exec": ["Tirer jusqu'au menton", "Contrôler"], "mistake": ["Se balancer", "Descendre à moitié"] }
    },
    {
      "id": "lat_pulldown",
      "name": "Lat Pulldown",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "CB",
      "tips": { "setup": ["Bloquer les genoux", "Poitrine sortie"], "exec": ["Tirer la barre vers le haut des pecs", "Coudes vers le bas"], "mistake": ["Se pencher trop en arrière", "Tirer derrière la nuque"] }
    },
    {
      "id": "barbell_bent_over_row",
      "name": "Barbell Bent Over Row",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "BB",
      "tips": { "setup": ["Buste penché 45°", "Dos neutre (plat)"], "exec": ["Tirer la barre au nombril", "Serrer les omoplates"], "mistake": ["Arrondir le dos (Danger!)", "Utiliser l'élan des hanches"] }
    },
    {
      "id": "seal_row",
      "name": "Seal Row",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "OT",
      "tips": { "setup": ["Allongé sur banc surélevé", "Haltères au sol"], "exec": ["Tirer les coudes vers le haut", "Zéro élan"], "mistake": ["Banc trop bas", "Amplitude incomplète"] }
    },
    {
      "id": "seated_dumbbell_row",
      "name": "Seated Dumbbell Row",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "DB",
      "tips": { "setup": ["Un genou sur le banc", "Dos plat", "Main d'appui sous l'épaule"], "exec": ["Tirer l'haltère vers la hanche (pas l'épaule)", "Coude proche du corps"], "mistake": ["Rotation du buste", "Tirer trop haut"] }
    },
    {
      "id": "seated_cable_row",
      "name": "Seated Cable Row",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "CB",
      "tips": { "setup": ["Pieds calés", "Dos droit", "Genoux fléchis"], "exec": ["Tirer la poignée au ventre", "Sortir la poitrine"], "mistake": ["Se pencher avant/arrière", "Épaules en avant"] }
    },
    {
      "id": "t_bar_row",
      "name": "T-Bar Row",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "BB",
      "tips": { "setup": ["Entre les jambes", "Dos plat impératif"], "exec": ["Tirer vers le haut", "Contracter le dos"], "mistake": ["Arrondir les lombaires", "Élan excessif"] }
    },
    {
      "id": "australian_pull_up",
      "name": "Australian Pull-Up",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "BW",
      "tips": { "setup": ["Barre basse", "Corps droit comme une planche"], "exec": ["Tirer la poitrine à la barre", "Omoplates serrées"], "mistake": ["Bassin qui tombe", "Tirer avec les bras uniquement"] }
    },
    {
      "id": "muscle_up",
      "name": "Muscle-Up",
      "type": "Polyarticulaire",
      "muscle": "Dos",
      "equipment": "BW",
      "tips": { "setup": ["Prise false grip (optionnel)", "Balancier contrôlé"], "exec": ["Tirer explosif au nombril", "Transition rapide vers dips"], "mistake": ["Kipping excessif", "Coudes asymétriques"] }
    },
    {
      "id": "back_extension",
      "name": "Back Extension",
      "type": "Isolation",
      "muscle": "Dos",
      "equipment": "BW",
      "tips": { "setup": ["Banc à lombaires réglé aux hanches"], "exec": ["Descendre dos plat", "Remonter aligné"], "mistake": ["Hyper-extension (cambrer trop)", "Vitesse excessive"] }
    },
    {
      "id": "dumbbell_shrug",
      "name": "Dumbbell Shrug",
      "type": "Isolation",
      "muscle": "Dos",
      "equipment": "DB",
      "tips": { "setup": ["Debout", "Bras tendus"], "exec": ["Hausser les épaules vers les oreilles", "Contrôler la descente"], "mistake": ["Rouler les épaules", "Plier les bras"] }
    },

    // JAMBES
    {
      "id": "barbell_squat",
      "name": "Barbell Squat",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "BB",
      "tips": { "setup": ["Barre sur trapèzes", "Pieds largeur épaules", "Regard droit"], "exec": ["Hanches en arrière et bas", "Genoux vers l'extérieur", "Briser la parallèle"], "mistake": ["Genoux qui rentrent (valgus)", "Talons qui décollent", "Dos qui s'arrondit"] }
    },
    {
      "id": "front_squat",
      "name": "Front Squat",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "BB",
      "tips": { "setup": ["Barre sur les deltoïdes avant", "Coudes hauts"], "exec": ["Descendre verticalement", "Genoux vers l'avant"], "mistake": ["Coudes qui chutent", "Dos qui s'arrondit"] }
    },
    {
      "id": "hack_squat",
      "name": "Hack Squat",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "EM",
      "tips": { "setup": ["Dos plaqué au dossier"], "exec": ["Descendre profond"], "mistake": ["Décoller les talons"] }
    },
    {
      "id": "leg_press",
      "name": "Leg Press",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "EM",
      "tips": { "setup": ["Dos plaqué au siège", "Pieds largeur bassin"], "exec": ["Descendre genoux vers épaules", "Pousser sans verrouiller"], "mistake": ["Décoller les fesses du siège", "Verrouiller les genoux (Danger!)"] }
    },
    {
      "id": "dumbbell_bulgarian_split_squat",
      "name": "Dumbbell Bulgarian Split Squat",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "DB",
      "tips": { "setup": ["Un pied sur banc arrière", "Équilibre stable"], "exec": ["Descendre genou arrière vers le sol", "Buste légèrement penché"], "mistake": ["Pied avant trop proche (talon décolle)", "Genou rentrant"] }
    },
    {
      "id": "dumbbell_lunge",
      "name": "Dumbbell Lunge",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "DB",
      "tips": { "setup": ["Pieds largeur bassin", "Haltères le long du corps"], "exec": ["Pas vers l'avant", "Genou arrière frôle le sol"], "mistake": ["Genou avant dépasse trop", "Perte d'équilibre"] }
    },
    {
      "id": "pistol_squat",
      "name": "Pistol Squat",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "BW",
      "tips": { "setup": ["Unilatéral", "Jambe libre tendue devant"], "exec": ["Descendre fesse sur talon", "Garder le talon au sol"], "mistake": ["Genou qui rentre", "Décoller le talon"] }
    },
    {
      "id": "romanian_deadlift",
      "name": "Romanian Deadlift",
      "type": "Polyarticulaire",
      "muscle": "Jambes",
      "equipment": "BB",
      "tips": { "setup": ["Pieds largeur hanches", "Omoplates serrées"], "exec": ["Pousser les fesses en arrière", "Jambes semi-tendues", "Descendre tant que le dos est plat"], "mistake": ["Arrondir le dos", "Transformer en Squat", "Barre trop loin des jambes"] }
    },
    {
      "id": "leg_extension",
      "name": "Leg Extension",
      "type": "Isolation",
      "muscle": "Jambes",
      "equipment": "EM",
      "tips": { "setup": ["Genou aligné avec l'axe machine", "Dos calé"], "exec": ["Tendre les jambes", "Contrôler la descente"], "mistake": ["Lancer la charge", "Décoller les fesses"] }
    },
    {
      "id": "lying_leg_curl",
      "name": "Lying Leg Curl",
      "type": "Isolation",
      "muscle": "Jambes",
      "equipment": "EM",
      "tips": { "setup": ["Genoux hors du banc", "Hanches plaquées"], "exec": ["Ramener talons aux fesses", "Contrôler le retour"], "mistake": ["Décoller les hanches (cambrer)", "Mouvement partiel"] }
    },
    {
      "id": "seated_leg_curl",
      "name": "Seated Leg Curl",
      "type": "Isolation",
      "muscle": "Jambes",
      "equipment": "EM",
      "tips": { "setup": ["Genoux alignés axe", "Bloqueur sur cuisses"], "exec": ["Fléchir vers le bas", "Retenir la montée"], "mistake": ["Décoller le dos", "Mouvement trop rapide"] }
    },
    {
      "id": "hip_thrust",
      "name": "Hip Thrust",
      "type": "Isolation",
      "muscle": "Jambes",
      "equipment": "BB",
      "tips": { "setup": ["Omoplates sur banc", "Barre sur le creux des hanches"], "exec": ["Monter le bassin", "Contracter fort les fessiers"], "mistake": ["Cambrer le dos", "Pousser avec les pointes de pieds"] }
    },

    // BRAS
    {
      "id": "barbell_curl",
      "name": "Barbell Curl",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "BB",
      "tips": { "setup": ["Debout", "Coudes proches du corps"], "exec": ["Flexion complète sans bouger les coudes"], "mistake": ["Balancier du buste", "Avancer les coudes"] }
    },
    {
      "id": "ez_bar_curl",
      "name": "EZ-Bar Curl",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "EZ",
      "tips": { "setup": ["Barre EZ (moins de stress poignets)"], "exec": ["Flexion biceps stricte"], "mistake": ["Utiliser le dos", "Coudes qui s'écartent"] }
    },
    {
      "id": "dumbbell_hammer_curl",
      "name": "Dumbbell Hammer Curl",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "DB",
      "tips": { "setup": ["Prise neutre (pouces vers haut)"], "exec": ["Monter vers l'épaule", "Alterné ou simultané"], "mistake": ["Rotation du poignet", "Élan"] }
    },
    {
      "id": "cable_bicep_curl",
      "name": "Cable Bicep Curl",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "RC",
      "tips": { "setup": ["Poulie basse", "Coudes au corps"], "exec": ["Flexion fluide", "Contraction en haut"], "mistake": ["Balancier", "Monter les coudes"] }
    },
    {
      "id": "preacher_curl",
      "name": "Preacher Curl",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "EM",
      "tips": { "setup": ["Aisselles sur le pupitre", "Bras tendus"], "exec": ["Flexion sans décoller les triceps"], "mistake": ["Décoller les fesses", "Amplitude trop courte"] }
    },
    {
      "id": "close_grip_bench_press",
      "name": "Close-Grip Bench Press",
      "type": "Polyarticulaire",
      "muscle": "Bras",
      "equipment": "BB",
      "tips": { "setup": ["Mains largeur épaules (pas trop serré)", "Coudes rentrés"], "exec": ["Descendre bas de poitrine", "Pousser triceps"], "mistake": ["Mains trop serrées (poignets)", "Coudes écartés"] }
    },
    {
      "id": "cable_pushdown",
      "name": "Cable Pushdown",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "CB",
      "tips": { "setup": ["Coudes verrouillés le long du corps", "Genoux fléchis"], "exec": ["Extension complète vers le bas", "Écarter la corde en bas"], "mistake": ["Monter les coudes", "Se pencher trop"] }
    },
    {
      "id": "dumbbell_overhead_triceps_extension",
      "name": "DB Overhead Triceps Ext.",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "DB",
      "tips": { "setup": ["Assis ou debout", "Haltère à deux mains"], "exec": ["Descendre derrière la tête", "Extension complète"], "mistake": ["Coudes trop ouverts", "Cambrer le dos"] }
    },
    {
      "id": "cable_overhead_triceps_extension",
      "name": "Cable Overhead Triceps Ext.",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "CB",
      "tips": { "setup": ["Dos à la poulie", "Coudes hauts"], "exec": ["Tendre les bras vers l'avant/haut"], "mistake": ["Manque de stabilité", "Bouger les épaules"] }
    },
    {
      "id": "barbell_lying_triceps_extension",
      "name": "Skullcrusher",
      "type": "Isolation",
      "muscle": "Bras",
      "equipment": "BB",
      "tips": { "setup": ["Allongé", "Barre au dessus du front"], "exec": ["Plier les coudes vers le front/arrière tête", "Extension"], "mistake": ["Coudes qui s'écartent", "Bouger les épaules"] }
    },

    // ABDOS
    {
      "id": "hanging_leg_raise",
      "name": "Hanging Leg Raise",
      "type": "Isolation",
      "muscle": "Abdos",
      "equipment": "BW",
      "tips": { "setup": ["Suspendu à la barre", "Corps stable"], "exec": ["Remonter genoux ou jambes vers poitrine", "Enrouler le bassin"], "mistake": ["Balancier", "Ne pas enrouler le bassin"] }
    },
    {
      "id": "lying_leg_raise",
      "name": "Lying Leg Raise",
      "type": "Isolation",
      "muscle": "Abdos",
      "equipment": "BW",
      "tips": { "setup": ["Allongé au sol", "Mains sous les fesses"], "exec": ["Lever les jambes tendues", "Décoller le bassin"], "mistake": ["Creuser le dos à la descente"] }
    },
    {
      "id": "cable_woodchopper",
      "name": "Cable Woodchopper",
      "type": "Isolation",
      "muscle": "Abdos",
      "equipment": "CB",
      "tips": { "setup": ["Poulie hauteur épaule", "De profil"], "exec": ["Rotation du buste vers genou opposé", "Bras tendus"], "mistake": ["Plier les bras", "Tourner les hanches"] }
    },
    {
      "id": "cable_crunch",
      "name": "Cable Crunch",
      "type": "Isolation",
      "muscle": "Abdos",
      "equipment": "CB",
      "tips": { "setup": ["A genoux face poulie", "Corde derrière nuque"], "exec": ["Enrouler le dos vers le sol", "Contracter abdos"], "mistake": ["Tirer avec les bras", "Garder le dos plat"] }
    },
    {
      "id": "crunch",
      "name": "Crunch",
      "type": "Isolation",
      "muscle": "Abdos",
      "equipment": "BW",
      "tips": { "setup": ["Au sol", "Jambes pliées"], "exec": ["Décoller les omoplates", "Regard vers genoux"], "mistake": ["Tirer sur la nuque", "Décoller le bas du dos"] }
    },
    {
      "id": "sit_up",
      "name": "Sit-Up",
      "type": "Isolation",
      "muscle": "Abdos",
      "equipment": "BW",
      "tips": { "setup": ["Pieds bloqués", "Genoux pliés"], "exec": ["Remonter tout le buste"], "mistake": ["Dos plat (préférer enroulement)", "Acoups"] }
    },
    {
      "id": "plank",
      "name": "Plank",
      "type": "Isométrique",
      "muscle": "Abdos",
      "equipment": "BW",
      "tips": { "setup": ["Appui avant-bras/orteils", "Corps aligné"], "exec": ["Serrer fesses et abdos", "Respirer"], "mistake": ["Dos creusé (Danger!)", "Fesses trop hautes"] }
    },

    // MOLLETS & AVANT-BRAS
    {
      "id": "standing_calf_raise",
      "name": "Standing Calf Raise",
      "type": "Isolation",
      "muscle": "Mollets",
      "equipment": "EM",
      "tips": { "setup": ["Pointes de pieds sur marche", "Jambes tendues"], "exec": ["Descendre talon au max", "Monter sur pointes"], "mistake": ["Rebondir en bas", "Amplitude réduite"] }
    },
    {
      "id": "seated_calf_raise",
      "name": "Seated Calf Raise",
      "type": "Isolation",
      "muscle": "Mollets",
      "equipment": "EM",
      "tips": { "setup": ["Assis", "Bloqueur sur genoux"], "exec": ["Extension cheville complète"], "mistake": ["Aider avec les mains", "Vitesse trop rapide"] }
    },
    {
      "id": "barbell_wrist_curl",
      "name": "Barbell Wrist Curl",
      "type": "Isolation",
      "muscle": "Avant-bras",
      "equipment": "BB",
      "tips": { "setup": ["Avant-bras sur banc", "Poignets dans le vide"], "exec": ["Flexion du poignet vers le haut"], "mistake": ["Décoller les avant-bras"] }
    },
    {
      "id": "dumbbell_wrist_curl",
      "name": "Dumbbell Wrist Curl",
      "type": "Isolation",
      "muscle": "Avant-bras",
      "equipment": "DB",
      "tips": { "setup": ["Unilatéral", "Avant-bras calé"], "exec": ["Enrouler le poignet"], "mistake": ["Mouvement trop rapide"] }
    },

    // SKILLS & ISOMETRIQUE
    {
      "id": "front_lever",
      "name": "Front Lever",
      "type": "Isométrique",
      "muscle": "Dos",
      "equipment": "BW",
      "tips": { "setup": ["Suspension barre", "Bras tendus"], "exec": ["Corps parallèle au sol", "Rétraction scapulaire"], "mistake": ["Bras pliés", "Hanches cassées"] }
    },
    {
      "id": "back_lever",
      "name": "Back Lever",
      "type": "Isométrique",
      "muscle": "Dos",
      "equipment": "BW",
      "tips": { "setup": ["Suspension inversée", "Skin the cat"], "exec": ["Descendre à l'horizontale", "Regard vers le sol"], "mistake": ["Creuser le dos", "Lâcher les épaules"] }
    },
    {
      "id": "full_planche",
      "name": "Full Planche",
      "type": "Isométrique",
      "muscle": "Épaules",
      "equipment": "BW",
      "tips": { "setup": ["Mains au sol", "Lean en avant"], "exec": ["Décoller les pieds", "Corps parallèle au sol"], "mistake": ["Bras pliés", "Hanches trop hautes"] }
    },
    {
      "id": "handstand_hold",
      "name": "Handstand Hold",
      "type": "Isométrique",
      "muscle": "Épaules",
      "equipment": "BW",
      "tips": { "setup": ["Mains largeur épaules", "Doigts écartés"], "exec": ["Pousser le sol (Grandir)", "Regard entre les mains"], "mistake": ["Marcher avec les mains", "Dos banane"] }
    },
    {
      "id": "human_flag",
      "name": "Human Flag",
      "type": "Isométrique",
      "muscle": "Abdos",
      "equipment": "BW",
      "tips": { "setup": ["Prise mixte espalier/poteau"], "exec": ["Bras du bas pousse, bras du haut tire", "Corps latéral"], "mistake": ["Hanches qui tournent", "Bras pliés"] }
    },

    // CARDIO
    {
      "id": "rowing_machine",
      "name": "Rowing Machine",
      "type": "Cardio",
      "muscle": "Cardio",
      "equipment": "EM",
      "tips": { "setup": ["Pieds sanglés", "Dos droit"], "exec": ["Poussée jambes -> Dos -> Bras", "Retour inverse"], "mistake": ["Arrondir le dos", "Tirer bras avant jambes"] }
    },
    {
      "id": "treadmill",
      "name": "Treadmill",
      "type": "Cardio",
      "muscle": "Cardio",
      "equipment": "EM",
      "tips": { "setup": ["Chaussures adaptées"], "exec": ["Course ou marche inclinée"], "mistake": ["Se tenir aux poignées (réduit l'effort)"] }
    },
    {
      "id": "stationary_bike",
      "name": "Stationary Bike",
      "type": "Cardio",
      "muscle": "Cardio",
      "equipment": "EM",
      "tips": { "setup": ["Selle hauteur hanche"], "exec": ["Pédalage fluide"], "mistake": ["Genoux qui rentrent", "Selle trop basse"] }
    }
];
