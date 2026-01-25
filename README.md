
# IronTracker V10 - Guide Utilisateur & Documentation

Bienvenue sur **IronTracker**, votre carnet d'entraînement numérique conçu pour la performance, l'autonomie et la progression.

Contrairement aux applications classiques, IronTracker fonctionne **100% en local** sur votre téléphone. Vos données vous appartiennent, aucune création de compte n'est nécessaire, et l'application est ultra-rapide.

---

## 📱 Installation (PWA)

IronTracker est une **Progressive Web App (PWA)**. Pour une expérience optimale :

1.  Ouvrez l'application dans votre navigateur (Chrome sur Android, Safari sur iOS).
2.  Appuyez sur le bouton de partage ou le menu options.
3.  Sélectionnez **"Sur l'écran d'accueil"** ou **"Installer l'application"**.
4.  L'app se comportera comme une application native (plein écran, sans barre d'adresse).

---

## 📖 Guide de Démarrage

### 1. 🏠 Dashboard (Accueil)
C'est votre tableau de bord.
*   **Calendrier Visuel :** Chaque jour d'entraînement est marqué. Plus la couleur est intense, plus le volume d'entraînement était élevé.
*   **Points de couleur :** Sous chaque date, des petits points indiquent les types d'exercices travaillés (ex: Rouge pour Polyarticulaire, Vert pour Cardio).
*   **Accès Rapide :** Boutons vers vos Records personnels et vos Graphiques de progression.

### 2. 📋 Programmes (Planification)
C'est ici que vous construisez votre routine.
*   L'app vient avec des programmes par défaut (Full Body, PPL, PHUL).
*   **Créer/Modifier :** Vous pouvez créer vos propres programmes et séances.
*   **Lancer une séance :** Appuyez sur une séance pour voir le résumé, puis cliquez sur "DÉMARRER".

### 3. 🏋️‍♂️ En Séance (Workout)
Le cœur de l'application. Voici les particularités à connaître :

#### 🔹 La Notation Intelligente (Smart Input)
Pour gagner du temps, l'application comprend vos raccourcis pour le temps (Cardio/Gainage) :
*   Tapez `1.30` ou `1,30` ➔ L'app convertit en **01:30** (1 min 30s).
*   Tapez `90` (pour du gainage) ➔ L'app convertit en **01:30**.
*   Tapez `10` (pour du cardio) ➔ L'app convertit en **10:00** (10 min).

#### 🔹 Concepts Clés
*   **RIR (Reps In Reserve) :** C'est l'intensité. "Combien de répétitions j'aurais encore pu faire avant l'échec ?"
    *   `0` = Échec musculaire (impossible d'en faire une de plus).
    *   `1` = J'en avais encore 1 sous le pied.
    *   `2-3` = Effort soutenu mais contrôlé.
*   **Fatigue (1-5) :** Notez votre état de forme en début de séance.
    *   `1` = Épuisé / Malade.
    *   `5` = Olympique / En pleine forme.

#### 🔹 Le Chronomètre
*   Validez une série (Bouton "VAL") ➔ Le chronomètre de repos se lance automatiquement selon le temps défini pour l'exercice.
*   Un bandeau apparaît en bas de l'écran. Vous pouvez ajouter/retirer 30s si besoin.

### 4. 📚 Bibliothèque
La liste de tous les exercices disponibles.
*   **Filtre :** Cherchez par nom, muscle ou type.
*   **Favoris :** Cliquez sur l'étoile pour retrouver vos exercices préférés en haut de liste.
*   **Création :** Ajoutez vos propres exercices personnalisés avec vos notes techniques.

### 5. 📈 Progrès & Analytics
Suivez votre évolution avec précision.

*   **SBD Ratio (Squat / Bench / Deadlift) :**
    *   Calcule votre force théorique sur les 3 mouvements rois par rapport à votre poids de corps.
    *   *Niveaux :* Fondation ➔ Intermédiaire ➔ Avancé ➔ Elite ➔ Pro.
*   **Estimation 1RM (e1RM) :**
    *   L'app utilise la **Formule de Wathen** pour estimer votre charge maximale théorique sur 1 répétition, basée sur vos séries longues (ex: 10 reps à 80kg).
*   **Volume Hebdo :**
    *   Affiche le nombre de séries **effectives** (RIR ≤ 4) par groupe musculaire pour s'assurer que vous en faites assez (ou pas trop).

### 6. ⚙️ Paramètres & Sauvegarde (Important !)
Comme l'application est hors-ligne, **vos données sont sur votre téléphone**.
*   **Export JSON :** Faites des sauvegardes régulières (fichier `.json`) via ce menu. Si vous changez de téléphone, il suffit de réimporter ce fichier.
*   **Export CSV :** Pour les fans d'Excel, exportez tout votre historique en format tableur pour faire vos propres analyses.

---

## 🎨 Légendes & Codes Couleurs

### Types d'exercices
| Type | Couleur | Description |
| :--- | :--- | :--- |
| **Polyarticulaire** | 🔴 Rouge | Mouvements de base (Squat, Bench, etc.) impliquant plusieurs articulations. |
| **Isolation** | 🔵 Bleu | Cible un muscle précis (Curl, Leg Extension). |
| **Cardio** | 🟢 Vert | Endurance (Vélo, Tapis, Rameur). |
| **Isométrique** | 🟣 Violet | Effort statique sans mouvement (Gainage, Chaise). |
| **Étirement** | ⚪ Gris | Mobilité et souplesse. |

### Groupes Musculaires
L'application suit les groupes principaux :
*   Pectoraux, Dos, Épaules
*   Jambes (Quadriceps/Ischios), Mollets
*   Bras (Biceps/Triceps), Avant-bras
*   Abdos, Cou, Cardio

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

---

*IronTracker V10 - Conçu pour ceux qui poussent.*
