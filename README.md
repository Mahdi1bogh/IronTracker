# IronTracker V10 🏋️‍♂️

> **L'application ultime de suivi de performance pour la musculation.**
> *SPA (Single Page Application) / PWA (Progressive Web App) / Mobile-First*

IronTracker V10 est une application web moderne conçue pour les pratiquants de musculation exigeants. Elle fonctionne entièrement dans le navigateur, stocke les données localement (pas de serveur requis) et offre une expérience utilisateur fluide proche d'une application native.

## ✨ Fonctionnalités Principales

### 🎯 Suivi d'Entraînement
- **Interface optimisée mobile :** Gros boutons, saisie rapide, mode sombre (Dark Mode) par défaut.
- **Séance en direct :** Chronomètre global, timer de repos intelligent (auto-start), calculateur de charge.
- **RIR / RPE :** Suivi de l'intensité via la méthode "Reps In Reserve".

### 📊 Analytics & Progression
- **Graphiques de Progression :** Visualisez l'évolution de vos charges et de votre e1RM (Estimated 1 Rep Max) sur n'importe quel exercice.
- **Volume Hebdomadaire :** Analyse automatique du nombre de séries difficiles par groupe musculaire pour gérer la fatigue.
- **Ratio Force/Poids :** Suivez votre force relative par rapport à votre poids de corps.
- **Records (PR) :** Tableau automatique de vos meilleurs performances historiques.

### 📚 Gestionnaire de Programmes & Bibliothèque
- **Programmes Personnalisables :** Créez vos propres routines (Split, Full Body, PPL...). *Le programme PHUL est inclus par défaut.*
- **Bibliothèque d'Exercices :** +50 exercices pré-enregistrés avec conseils techniques (Setup, Exécution, Erreurs à éviter).
- **Calculateur 1RM :** Estimez votre max sur une rep à partir de vos performances.

### ⚙️ Technique & Données
- **100% LocalStorage :** Vos données restent sur votre appareil. Respect total de la vie privée.
- **Import / Export JSON :** Sauvegardez vos données ou transférez-les sur un autre appareil.
- **Thèmes :** Personnalisez l'accent de couleur (Bleu, Or, Émeraude, Violet, Rouge).

---

## 🛠 Tech Stack

Ce projet est construit avec les dernières technologies web pour garantir performance et maintenabilité :

- **Framework :** [React 18](https://react.dev/)
- **Langage :** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool :** [Vite](https://vitejs.dev/)
- **Styling :** [Tailwind CSS](https://tailwindcss.com/)
- **Graphiques :** [Recharts](https://recharts.org/)
- **Architecture :** Single Page Application (SPA)

---

## 🚀 Installation & Démarrage

### Pré-requis
- Node.js (v18 ou supérieur)

### 1. Installation
Clonez le projet et installez les dépendances :

```bash
npm install
```

### 2. Développement
Pour lancer le serveur de développement local :

```bash
npm run dev
```

### 3. Production (Build)
Pour créer la version optimisée pour la mise en ligne (dossier `dist`) :

```bash
npm run build
```

---

## 🌍 Déploiement

Cette application est "statique", elle peut être hébergée gratuitement et facilement partout.

**Option recommandée (Netlify / Vercel) :**
1. Exécutez `npm run build`.
2. Glissez le dossier `dist` généré sur [Netlify Drop](https://app.netlify.com/drop).
3. Votre app est en ligne !

---

## 📱 Utilisation Mobile (PWA)

Pour une expérience "App Native" sur iOS ou Android :
1. Ouvrez le site dans Safari (iOS) ou Chrome (Android).
2. Appuyez sur "Partager" (iOS) ou le menu "..." (Android).
3. Sélectionnez **"Sur l'écran d'accueil"**.
4. L'application se lance maintenant en plein écran, sans barre d'adresse.

---

## 📄 Licence

Projet personnel. Utilisation libre.
