
# IronTracker

**Version :** 2.6.0
**Type :** Progressive Web App (PWA) / Local-First

IronTracker est un carnet d'entraînement numérique conçu pour être simple, rapide et respectueux des données de l'utilisateur. L'application fonctionne entièrement dans le navigateur de votre appareil, sans serveur ni création de compte.

## Fonctionnalités

### Gestion de l'entraînement
*   **Suivi polyvalent** : Supporte la Musculation (Poids/Reps), le Calisthenics (Poids du corps), le Cardio (Distance/Temps) et le Statique (Temps).
*   **Bibliothèque extensible** : Plus de 80 exercices inclus par défaut. Possibilité de créer, modifier et archiver vos propres exercices.
*   **Modes de saisie** :
    *   *Actif* : Chronomètre de repos automatique (Smart Timer) et saisie en temps réel.
    *   *Log* : Saisie rapide d'une séance passée.
*   **Organisation** : Création de programmes personnalisés. Réorganisation des exercices et des séances via une interface simple.

### Analyse & Progression
*   **Tableau de bord** : Calendrier d'activité et indicateurs de fréquence.
*   **Micro-Analyse** : Suivi par exercice (1RM Estimé, Charge Max, Volume). Comparaison des performances avec la séance précédente.
*   **Macro-Analyse** : Graphiques de volume hebdomadaire, répartition musculaire (Radar Chart) et gestion de la fatigue.
*   **Exports** : Vos données vous appartiennent. Export complet au format JSON (Sauvegarde) ou CSV (Compatible Excel/Sheets).

### Outils intégrés
*   **Calculateur 1RM** : Estimation basée sur la formule de *Wathen*.
*   **Calculateur de Charge** : Assistant pour le chargement des disques sur la barre.
*   **Convertisseur** : Estimation d'équivalence entre charges "Barre" et "Haltères".

## Terminologie & Légendes

### Types d'exercices
*   🔴 **Polyarticulaire** : Mouvements composés (Squat, Dips, Tractions...).
*   🔵 **Isolation** : Mouvements mono-articulaires.
*   🟣 **Isométrique** : Effort statique (Planche, Front Lever...).
*   🟢 **Cardio** : Endurance fondamentale ou HIIT.
*   ⚪ **Étirement** : Mobilité.

### Indicateurs
*   **PR** (Personal Record) : Record personel déplacé sur une charge de travail.
*   **RPE / Forme** : Évaluation subjective de la forme du jour (1 à 5).
*   **RIR** (Reps In Reserve) : Nombre de répétitions encore possibles avant l'échec.
*   **W** (Warmup) : Indique une série d'échauffement (exclue des statistiques de performance).

## Installation

IronTracker est une PWA (Progressive Web App). Elle s'installe depuis votre navigateur mobile sans passer par l'App Store ou le Play Store.

1.  Ouvrez l'application dans votre navigateur (Chrome, Safari...).
2.  Accédez au menu du navigateur.
3.  Sélectionnez "Ajouter à l'écran d'accueil" ou "Installer l'application".

L'application fonctionne ensuite hors-ligne.

## Stack Technique

*   **Frontend** : React, TypeScript, TailwindCSS.
*   **State** : Zustand (Persistance via LocalStorage).
*   **Charts** : Recharts.
*   **Build** : Vite.
