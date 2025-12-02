# Dexia Backend

Ce dossier contient les modèles de données et services pour la base de films SQLite utilisée par l'application mobile.



## Structure
- `src/models/` : modèles de données (films, utilisateurs, interactions)
- `src/services/` : logique métier et algorithme de recommandation
- `database.db` : base de données SQLite

## 🎯 Algorithme de Recommandation Intelligent

### Comment ça fonctionne
Dexia apprend vos goûts en temps réel grâce à un système de recommandation qui évolue avec chaque swipe.

### Le Cycle d'Apprentissage

**Démarrage**  
Vous choisissez quelques genres lors de l'onboarding pour donner une base à l'algorithme.

**Apprentissage Dynamique**
- **👍 Like :** Les genres du film gagnent +1 point (max 10), des mots-clés sont extraits de la description
- **👎 Dislike :** Les genres perdent -0.5 point (min -5), ils sortent des préférences si le score devient négatif

**Recommandations Équilibrées**
- **70% de films ciblés** (basés sur vos genres préférés et mots-clés)
- **30% de films découverte** (autres genres pour éviter l'enfermement)

### Intelligence Anti-Bulle
Le système surveille automatiquement si vous vous enfermez dans un seul type de contenu et déclenche un nettoyage des préférences trop rigides. Les genres "bannis" peuvent revenir naturellement via les films découverte - c'est vous qui décidez de les réintégrer.

### 💡 Exemple Concret

1. Vous aimez "Avengers" → Action **+1 point**
2. Vous aimez "Iron Man" → Action **+1 point** (total: 2)  
3. Vous dislikez "Transformers" → Action **-0.5 point** (total: 1.5)
4. L'app privilégie Action mais propose aussi des Comédies
5. Vous aimez "Deadpool" → Comédie **+1 point**
6. **Profil final :** Action + Comédie préférés
**Résultat :** Un système qui apprend de vos goûts, évolue avec vous, et vous surprend avec de nouvelles découvertes.