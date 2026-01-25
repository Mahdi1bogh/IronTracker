
# IronTracker V10 - Manuel d'Utilisation

**IronTracker** est une application web progressive (PWA) de suivi de performance pour la musculation, conçue pour l'autonomie et la précision. Elle fonctionne intégralement en local (Local-First) pour garantir rapidité et confidentialité des données.

🔗 **Accéder à l'application :** [https://iron-tracker-chi.vercel.app/](https://iron-tracker-chi.vercel.app/)

---

## 1. Installation & Démarrage

Bien qu'accessible via un navigateur, IronTracker est conçue pour être installée sur votre appareil mobile pour une expérience native (plein écran, accès hors-ligne).

**Sur iOS (Safari) :**
1.  Ouvrez le lien dans Safari.
2.  Appuyez sur le bouton "Partager" (carré avec une flèche vers le haut).
3.  Sélectionnez **"Sur l'écran d'accueil"**.

**Sur Android (Chrome) :**
1.  Ouvrez le lien dans Chrome.
2.  Appuyez sur le menu (3 points) ou sur le bandeau d'installation qui apparaît.
3.  Sélectionnez **"Installer l'application"**.

---

## 2. Dashboard & Calendrier

L'écran d'accueil offre une vue d'ensemble immédiate de votre fréquence et volume d'entraînement.

*   **Calendrier Thermique :** Chaque jour est coloré selon l'intensité de la séance. Plus la couleur est opaque, plus le volume de la séance était élevé.
*   **Indicateurs de Type :** Sous chaque date, des pastilles colorées indiquent les types de mouvements effectués (ex: Rouge pour Polyarticulaire, Vert pour Cardio).
*   **Navigation :** Cliquez sur une date passée pour consulter le détail exact des séances (exercices, charges, notes).

---

## 3. Gestion des Programmes

L'onglet **Programmes** est votre centre de planification. L'application est fournie avec des templates standards (Full Body, PPL, PHUL) que vous pouvez modifier ou supprimer.

*   **Éditeur de Programme :** Vous pouvez créer des structures complexes (ex: Push A, Push B). Pour chaque exercice, vous définissez les objectifs par défaut (Séries, Reps, RIR cible, Temps de repos).
*   **Démarrage Rapide :** Il suffit de déplier un programme et de cliquer sur le nom d'une séance pour voir son résumé, puis "DÉMARRER" pour lancer le tracking.

---

## 4. Séance en cours (Workout)

C'est le cœur de l'application. L'interface est optimisée pour minimiser les clics et maximiser la concentration.

### Notation & Smart Input
L'application utilise un système de saisie intelligent pour les champs temporels.
*   **Pour le Cardio/Temps :** Si vous tapez `1.30` ou `90`, l'application convertira automatiquement en `01:30`. Si vous tapez `10` dans un champ cardio, cela devient `10:00`.
*   **RIR (Reps In Reserve) :** Indicateur crucial d'intensité.
    *   **0 :** Échec musculaire (aucune répétition supplémentaire possible).
    *   **1-2 :** Zone d'hypertrophie efficace.
    *   **3+ :** Échauffement ou récupération.
*   **Fatigue (1-5) :** À renseigner en début de séance pour corréler vos performances avec votre état de forme (1=Épuisé, 5=Olympique).

### Spécificités par Type de Mouvement
Les champs de saisie s'adaptent automatiquement selon le type d'exercice défini dans la bibliothèque :

1.  **Force/Hypertrophie (Poly/Iso) :**
    *   Champs : Poids (kg) | Répétitions | RIR.
    *   *Timer :* Se déclenche à la validation de la série.
2.  **Cardio :**
    *   Champs : Niveau (résistance) | Distance (mètres) | Durée (MM:SS).
3.  **Isométrique (Gainage) :**
    *   Champs : Lest (kg) | Durée (MM:SS) | RIR.

---

## 5. Analyse & Progression

L'onglet **Progrès** propose des outils d'analyse avancés pour auditer votre entraînement.

### A. Graphique de Progression
Permet de visualiser l'évolution d'un exercice spécifique sur différentes périodes (7j, 30j, 1 an, Tout).
*   **Mode MAX :** Affiche la charge maximale soulevée lors de la séance. Utile pour la force.
*   **Mode VOLUME :** Nombre total de séries validées.
*   **Mode TONNAGE :** Total des volumes (Séries × Reps × Poids). Indicateur de la charge de travail globale.

### B. Volume Hebdo
Analyse la répartition de votre entraînement sur la semaine glissante.
*   **Vue Muscles (Séries Effectives) :** Ne comptabilise que les séries "dures" (RIR ≤ 4). Cela permet de vérifier si vous stimulez suffisamment chaque groupe musculaire sans tomber dans le surmenage.
*   **Vue Types :** Répartition globale (Polyarticulaire vs Isolation vs Cardio).

### C. SBD Tracker (Ratio de Force)
Un outil pour les pratiquants de force athlétique. Il nécessite des données sur les mouvements : Squat, Bench Press et Deadlift.
*   **Calcul :** (Max Squat + Max Bench + Max Deadlift) / Poids de corps.
*   **Niveaux de standards :**
    *   *Fondation (< 2.0)*
    *   *Intermédiaire (2.0 - 3.0)*
    *   *Avancé (3.0 - 4.0)*
    *   *Elite (4.0 - 5.0)*
    *   *Pro (> 5.0)*

---

## 6. Outils & Calculateurs

### Bibliothèque d'Exercices
*   **Tags :** Chaque exercice est classé par Muscle, Type (Poly/Iso/Cardio/Iso/Stretch) et Équipement.
*   **Favoris :** Utilisez l'étoile pour prioriser vos mouvements fréquents.
*   **Tips :** Certains exercices contiennent des conseils techniques (Setup, Exécution, Erreurs) accessibles via le bouton `?` en séance.

### Calculateur 1RM & Records
Accessible depuis le Dashboard.
*   **Formule :** Utilise la formule de **Wathen**, réputée plus précise que Epley pour les charges modérées à lourdes.
*   **Estimation :** Permet de projeter votre max théorique à partir d'une performance en séries (ex: 8 reps à 80kg).
*   **Convertisseur :** Outil pratique pour convertir rapidement une charge "Barre" en charge "Haltères par main" (ratio de 0.8 utilisé pour la conversion unilatérale).

---

## 7. Sauvegarde & Données

Vos données sont stockées localement dans le navigateur de votre téléphone.
*   **Export JSON :** Dans l'onglet *Paramètres*, exportez régulièrement votre fichier de sauvegarde. C'est la seule façon de transférer vos données vers un autre appareil.
*   **Export CSV :** Génère un fichier compatible Excel/Google Sheets contenant l'intégralité de votre historique, ligne par ligne, pour vos propres analyses statistiques.
*   **Zone de Danger :** La réinitialisation efface définitivement toutes les données locales.

---

## 8. Légendes Visuelles

### Types d'exercices
*   🔴 **Rouge :** Polyarticulaire (Base, lourd, nerveux).
*   🔵 **Bleu :** Isolation (Ciblage, hypertrophie).
*   🟢 **Vert :** Cardio (Endurance, métabolique).
*   🟣 **Violet :** Isométrique (Statique, gainage).
*   ⚪ **Gris :** Étirement / Mobilité.

### Niveau de Forme (Fatigue)
Visible sur le calendrier (pastille en haut à gauche du jour) :
*   🔴 **Rouge (1/5) :** Épuisé / Malade.
*   🟠 **Orange (2/5) :** Fatigué / Courbaturé.
*   🟡 **Or (3/5) :** Normal / Moyen.
*   🟢 **Vert Clair (4/5) :** En forme.
*   🌳 **Vert Foncé (5/5) :** Olympique / Prime.

---

## 🛠 Stack Technique (Pour les développeurs)

*   **Framework :** React 18
*   **Langage :** TypeScript
*   **Build Tool :** Vite
*   **CSS :** Tailwind CSS
*   **Charts :** Recharts
*   **Architecture :** Local-First (LocalStorage), PWA, Single Page Application (SPA).

### Commandes
```bash
npm install  # Installation
npm run dev  # Serveur local
npm run build # Production
```
