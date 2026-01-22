# IronTracker V10

IronTracker V10 est une application de suivi d'entraînement (Progressive Web App) conçue pour la performance et l'autonomie. Elle fonctionne entièrement côté client (Client-Side Only), garantissant la rapidité et la confidentialité des données via le stockage local.

## Architecture & Fonctionnalités

### Core
*   **Architecture SPA/PWA :** Application web réactive conçue pour être installée sur mobile (iOS/Android) via la fonction "Ajouter à l'écran d'accueil".
*   **Local-First :** Persistance des données via `localStorage`. Aucune base de données distante ni création de compte requise.
*   **Gestion des Données :** Système complet d'export et d'import au format JSON pour la sauvegarde ou le transfert entre appareils.

### Suivi d'Entraînement
*   Interface optimisée pour l'utilisation tactile en salle.
*   Gestion avancée des métriques : Poids, Répétitions, RIR (Reps In Reserve).
*   Chronomètre de repos automatique et calculs de charge en temps réel.

### Analytics & Progression
*   **Estimation 1RM (e1RM) :** Calcul dynamique basé sur la formule de Brzycki.
*   **Volume d'entraînement :** Analyse du volume hebdomadaire par groupe musculaire (filtrage des séries effectives).
*   **Historique :** Visualisation graphique de la progression linéaire et des records personnels (PR).

### Personnalisation
*   Éditeur de programmes complet (Split, Full Body, etc.).
*   Bibliothèque d'exercices extensible avec métadonnées techniques (Setup, Exécution).
*   Système de thèmes visuels dynamiques.

---

## Stack Technique

*   **Runtime :** React 18
*   **Langage :** TypeScript
*   **Build System :** Vite
*   **Styling :** Tailwind CSS
*   **Visualisation :** Recharts

---

## Installation & Développement

### Prérequis
*   Node.js (v18+)
*   npm

### Installation des dépendances
```bash
npm install
```

### Serveur de développement
Lance l'application en mode local avec rechargement à chaud (HMR).
```bash
npm run dev
```

### Compilation (Production)
Génère les fichiers statiques optimisés dans le dossier `dist`.
```bash
npm run build
```

---

## Déploiement

L'application étant statique, elle peut être hébergée sur n'importe quel serveur web ou CDN.

**Procédure recommandée (Netlify/Vercel) :**
1.  Exécuter la commande `npm run build`.
2.  Déployer le contenu du dossier `dist`.

## Configuration Mobile (PWA)

Pour bénéficier de l'expérience plein écran sans barre d'adresse :

**iOS (Safari) :**
Bouton Partager > Sur l'écran d'accueil.

**Android (Chrome) :**
Menu > Installer l'application / Ajouter à l'écran d'accueil.

---

## Licence

Projet personnel open-source.
