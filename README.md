
# IronTracker

**Version :** 3.0.0 (Gold)
**Type :** Progressive Web App (PWA) / Local-First

IronTracker est un carnet d'entraînement numérique conçu pour les pratiquants de musculation exigeants. L'application combine une esthétique minimaliste "Glassmorphism" avec une architecture de données rigoureuse, fonctionnant entièrement en local sur votre appareil.

## Fonctionnalités

### Gestion de l'entraînement
*   **Suivi Multi-Modal** : Support natif pour la Musculation (Poids/Reps), le Calisthenics, le Cardio (Distance/Temps) et l'Isométrie.
*   **Bibliothèque Intelligente** :
    *   Plus de 80 exercices pré-configurés avec conseils techniques (Setup, Exécution, Erreurs).
    *   **Smart Filters** : Filtrage cyclique rapide par Type (Poly, Isol, Cardio...) et Équipement (Barre, Haltère, Poulie...).
    *   Recherche textuelle instantanée.
*   **Workflow "Zero-Friction"** :
    *   *Mode Actif* : Chronomètre de repos automatique (Overlay), calcul de 1RM en temps réel et indicateurs de tendance.
    *   *Mode Log* : Saisie rapide a posteriori pour maintenir l'historique à jour.

### Analyse & Performance
*   **Tableau de Bord Bento** : Vue synthétique du volume hebdomadaire, de la fréquence et des records sans aucun clic.
*   **Standards SBD** : Analyse de la force relative (Ratio Poids de Corps) sur le Squat, Bench et Deadlift avec projection sur les standards de force (Novice à Élite).
*   **Micro & Macro Data** :
    *   Graphiques de volume par groupe musculaire ou type de mouvement.
    *   Suivi de la fatigue (RPE) vs Volume.
    *   Courbes de progression 1RM estimé.

### Données & Souveraineté
*   **Local-First** : Aucune donnée n'est envoyée dans le cloud. Tout réside dans votre navigateur.
*   **Exports Complets** :
    *   **JSON** : Sauvegarde complète de l'état de l'application (Historique, Bibliothèque, Programmes).
    *   **CSV (Excel)** : Export granulaire incluant Objectifs vs Réalisé, Temps de repos théoriques et métriques de validation pour analyse externe.

### Outils Intégrés
*   **Calculateur 1RM** : Formule de *Wathen* pour une estimation précise.
*   **Plate Loader** : Assistant visuel pour le chargement des barres.
*   **Convertisseur** : Équivalence de charge Barre ↔ Haltères (-20% stabilité).

## Terminologie

*   🔴 **Polyarticulaire** : Mouvements composés (Squat, Dips, Tractions...).
*   🔵 **Isolation** : Mouvements mono-articulaires de finition.
*   🟣 **Statique** : Effort isométrique (Planche, Front Lever...).
*   🟢 **Cardio** : Endurance et HIIT.
*   ⚪ **Étirement** : Mobilité et souplesse.

## Installation (PWA)

IronTracker s'installe comme une application native sans passer par les stores :

**iOS (Safari) :**
1.  Bouton "Partager" (carré avec flèche).
2.  "Sur l'écran d'accueil".

**Android (Chrome) :**
1.  Menu (3 points).
2.  "Installer l'application".

## Stack Technique

*   **Core** : React 18, TypeScript, Vite.
*   **State Management** : Zustand (Persistance LocalStorage optimisée).
*   **UI/UX** : TailwindCSS (Design System Custom "Aesthetix"), Recharts.
*   **Architecture** : Code Splitting, Lazy Loading, Service Workers (Offline support).
