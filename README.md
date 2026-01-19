# Dexia - Application de Recommandation de Films

Dexia est une application mobile de recommandation de films développée avec React Native et Expo, utilisant un système de recommandation personnalisé basé sur les préférences utilisateur et un algorithme de matching intelligent.

## Fonctionnalités

### Profil et Onboarding
- **Création de profil** : Commencez par créer votre profil utilisateur unique.
- **Onboarding personnalisé** : Sélectionnez vos genres préférés (action, comédie, drame, etc.) pour calibrer immédiatement les recommandations.

### Paramètres
- **Changement de langue** : L'application s'adapte automatiquement à la langue de votre appareil, mais vous pouvez aussi changer la langue manuellement.
- **Thème** : Choisissez entre le mode clair, le mode sombre, ou laissez l'application suivre les paramètres système.
- **Préférence** : Visualisez et gérez les genres sélectionnés comme favoris.
- **Compte** : Gérez votre profil utilisateur.
- **Confidentialité** : Options pour effacer l'historique ou supprimer le profil.
- **Aide et support** : Réponses aux questions fréquentes sur l'utilisation.

### Page d'Accueil (Main Page)
- **Films aimés** : Historique des films likés avec descriptions et infos.
- **À voir (Watchlist)** : Liste de films mis de côté. Possibilité de liker une fois vu.
- **Recommandations personnalisées** : Mises à jour après chaque swipe pour s'affiner constamment.
- **Statistiques** : Diagramme (Camembert) des genres préférés basé sur les likes.
- **Prêt à découvrir** : Accès rapide à l'interface de swipe.

### Interface de Swipe
- **Interactions** : Like (droite), Dislike (gauche), Retour (undo), À voir.
- **Match Score** : Indication "TOP" si la compatibilité dépasse 75%.
- **Navigation** : Retour rapide à l'accueil.

## Installation

### Prérequis
- Node.js installé.
- Expo Go sur votre téléphone.

### Mac OS
1. Ouvrez votre terminal.
2. Clonez le projet : `git clone [URL_DU_REPO]`
3. Entrez dans le dossier : `cd Dexia`
4. Installez les dépendances : `npm install`
5. Lancez le serveur : `npx expo start`

### Windows
1. Ouvrez PowerShell ou l'invite de commande.
2. Clonez le projet : `git clone [URL_DU_REPO]`
3. Entrez dans le dossier : `cd Dexia`
4. Installez les dépendances : `npm install`
5. Lancez le serveur : `npx expo start`

### Linux
1. Ouvrez votre terminal.
2. Clonez le projet : `git clone [URL_DU_REPO]`
3. Entrez dans le dossier : `cd Dexia`
4. Installez les dépendances : `npm install`
5. Lancez le serveur : `npx expo start`

### Utilisation avec Expo Go
1. Lancez `npx expo start` sur votre ordinateur.
2. Scannez le QR code affiché dans le terminal avec l'app Expo Go sur votre téléphone (Android) ou l'appareil photo (iOS).

---

## Documentation Technique

## 🛠 Technologies utilisées

- **React Native** (0.81.5) - Framework de développement mobile
- **Expo** (~54.0.25) - Plateforme et outils de développement
- **TypeScript** - Typage statique pour JavaScript
- **Expo SQLite** - Base de données locale SQLite
- **React Native Reanimated** - Animations performantes
- **React Native Gesture Handler** - Gestion des gestes tactiles
- **NativeWind** (Tailwind CSS) - Styling avec classes utilitaires
- **Expo Router** - Navigation basée sur le système de fichiers

## 🏗 Architecture de l'application

L'application suit une architecture modulaire organisée en plusieurs couches :

```
Dexia/
├── app/                    # Écrans de l'application (Expo Router)
│   ├── index.tsx          # Point d'entrée avec routage conditionnel
│   ├── welcomeScreen.tsx  # Écran de bienvenue
│   ├── onBoarding.tsx     # Configuration initiale des préférences
│   ├── homeScreen.tsx     # Page d'accueil avec recommandations
│   ├── swipe.tsx         # Interface de swipe principale
│   └── settings.tsx      # Paramètres utilisateur
├── src/
│   ├── models/           # Modèles de données et accès DB
│   │   ├── db.ts         # Gestion de la connexion SQLite
│   │   ├── user.ts       # Gestion du profil utilisateur
│   │   ├── movies.ts     # Accès aux données films
│   │   ├── interaction.ts # Gestion des interactions (like/dislike)
│   │   └── cast.ts        # Informations sur le casting
│   ├── services/         # Services métier
│   │   └── RecommendationService.ts # Algorithme de recommandation
│   └── utils/            # Utilitaires
│       └── posterMap.ts  # Mapping des affiches de films
└── assets/               # Ressources statiques (affiches, etc.)
```

### Flux de navigation

1. **Écran d'accueil** (`index.tsx`) : Vérifie si l'utilisateur a terminé l'onboarding
2. **Écran de bienvenue** (`welcomeScreen.tsx`) : Présentation de l'application
3. **Onboarding** (`onBoarding.tsx`) : Sélection des genres préférés et films de référence
4. **Page d'accueil** (`homeScreen.tsx`) : Affichage des recommandations personnalisées
5. **Swipe** (`swipe.tsx`) : Interface principale de découverte de films

## 💾 Base de données

La base de données SQLite contient plusieurs tables principales :

### Structure des tables

#### `movies`
Stocke les informations sur les films :
- `id` : Identifiant unique (TMDB ID)
- `title` : Titre du film
- `overview` : Synopsis
- `release_date` : Date de sortie
- `vote_average` : Note moyenne
- `popularity` : Score de popularité
- `poster_path` : Chemin vers l'affiche

#### `genres`
Liste des genres disponibles (Action, Science-Fiction, Drame, etc.)

#### `movie_genres`
Table de liaison entre films et genres

#### `user_profile`
Profil utilisateur unique :
- `id` : Identifiant utilisateur (toujours 1, application mono-utilisateur)
- `preferences` : JSON des genres préférés `[genre_id1, genre_id2, ...]`
- `keywords` : JSON des mots-clés dynamiques avec poids
- `genre_weights` : JSON des poids par genre (système de scoring)
- `onboarding_done` : Booléen indiquant si l'onboarding est terminé

#### `user_interactions`
Historique des interactions utilisateur :
- `user_id` : ID utilisateur
- `movie_id` : ID du film
- `action_type` : Type d'action (`like`, `dislike`, `view`, `watchlist`)
- `created_at` : Timestamp de l'interaction


## 🎯 Système de recommandation

L'algorithme de recommandation combine plusieurs stratégies pour proposer des films pértinent.

### Algorithme principal (`getTinderRecommendations`)

L'algorithme fonctionne en plusieurs étapes :

1. **Récupération des préférences** : Genres préférés et mots-clés dynamiques de l'utilisateur
2. **Exclusion des films vus** : Tous les films déjà interagis sont exclus
3. **Sélection ciblée** (70% des recommandations) :
   - Films correspondant aux genres préférés
   - Filtrage par mots-clés dans le synopsis
   - Scoring : `vote_average * 0.7 + popularity * 0.3 + bonus_mots_clés`
4. **Sélection découverte** (30% des recommandations) :
   - Films en dehors des genres préférés
   - Permet d'éviter la "bulle de filtres"
   - Scoring : `vote_average * 0.6 + popularity * 0.4`
5. **Mélange aléatoire** : Les deux listes sont combinées et mélangées pour varier l'expérience

### Système de mots-clés dynamiques

Les mots-clés sont extraits automatiquement des films likés par l'utilisateur :

- **Extraction** : Analyse du titre et du synopsis pour identifier des mots significatifs
- **Filtrage** : Exclusion des mots vides (stop words) et des termes trop génériques
- **Pondération** : Chaque mot-clé a un poids qui augmente avec les likes et diminue avec les dislikes
- **Limite FIFO** : Maximum de 20 mots-clés dynamiques, les plus anciens/faibles sont supprimés

### Système de genres dynamiques

Les genres sont gérés avec un système de poids :

- **Like** : +1 point (maximum 10)
- **Dislike** : -0.5 point (minimum -5)
- Seuls les genres avec un poids ≥ 1 sont considérés comme préférés

### Détection de bulle de filtres

L'algorithme détecte deux types de problèmes :

1. **Over-disliking** : Plus de 70% de dislikes récents → Réduction de la spécificité
2. **Saturation de mots-clés** : Trop de mots-clés à poids élevé → Diversification

En cas de détection, le système nettoie automatiquement les préférences pour élargir les recommandations.

## 📊 Algorithme de matching

Le pourcentage de match affiché pour chaque film est calculé selon la formule suivante :

```typescript
matchPercentage = (genreMatchRatio * 0.8) + (keywordMatch * 0.2)
```

### Calcul du genreMatchRatio

```typescript
matchingGenres = genres_du_film ∩ genres_préférés_utilisateur
genreMatchRatio = matchingGenres.length / max(genres_préférés.length, genres_du_film.length)
```

### Calcul du keywordMatch

```typescript
matchingKeywords = mots_clés_préférés présents dans (titre OU synopsis)
keywordMatch = matchingKeywords.length / mots_clés_préférés.length
```

### Normalisation

Le score final est normalisé entre 20% et 98% pour éviter les scores trop extrêmes :
- Minimum : 20% (même sans correspondance)
- Maximum : 98% (pour laisser de la marge)