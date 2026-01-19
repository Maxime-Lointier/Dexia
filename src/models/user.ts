import { getDatabase } from './db';
import { Language } from '../i18n';

export const CURRENT_USER_ID = 1;

export interface UserPreferences {
  genres: number[];
  keywords: string[];
  actors: number[];
}

export interface DynamicKeyword {
  keyword: string;
  weight: number;
  added: string;
  lastUsed: string;
}

export interface KeywordData {
  static: string[];
  dynamic: DynamicKeyword[];
}

export interface BubbleDetectionResult {
  hasBubble: boolean;
  bubbleType: 'over_disliking' | 'keyword_saturation' | 'none';
  confidence: number;
  recommendation?: string;
}

export interface UserProfile {
  id: number;
  name: string;
  preferences?: string;
  keywords?: string;
  onboarding_done?: number;
  language?: string;
}

/**
 * Récupère les préférences utilisateur (genres et mots clés)
 * @param userId - ID de l'utilisateur
 * @returns Promise<UserPreferences> - Préférences de l'utilisateur
 */
export async function getUserPreferences(userId: number): Promise<UserPreferences> {
  const db = await getDatabase();
  const sql = 'SELECT preferences, keywords FROM user_profile WHERE id = ?';
  const row = await db.getFirstAsync<{ preferences: string | null; keywords: string | null }>(sql, [userId]);

  if (!row) {
    return { genres: [], keywords: [], actors: [] };
  }

  const genres = row.preferences ? JSON.parse(row.preferences) : [];
  const keywordsArray = await exportUserKeywordsToArray(userId);

  const actors = await getPreferredActors(userId);

  return {
    genres,
    keywords: keywordsArray,
    actors
  };
}


/**
 * Récupère la langue préférée de l'utilisateur
 */
export async function getUserLanguage(userId: number): Promise<Language> {
  const db = await getDatabase();
  try {
    const row = await db.getFirstAsync<{ language: string | null }>(
      'SELECT language FROM user_profile WHERE id = ?',
      [userId]
    );
    return (row?.language as Language) || 'fr';
  } catch (error) {
    return 'fr';
  }
}

/**
 * Met à jour la langue de l'utilisateur
 */
export async function updateUserLanguage(userId: number, lang: Language): Promise<boolean> {
  const db = await getDatabase();
  try {
    await db.runAsync('UPDATE user_profile SET language = ? WHERE id = ?', [lang, userId]);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour langue:', error);
    return false;
  }
}
/**
 * Vérifie si l'onboarding est terminé pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Promise<boolean> - true si l'onboarding est terminé
 */
export async function isOnboardingDone(userId: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ onboarding_done: number }>(
    'SELECT onboarding_done FROM user_profile WHERE id = ?',
    [userId]
  );

  return row ? row.onboarding_done === 1 : false;
}

/**
 * Définit l'état de l'onboarding pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @param done - true si l'onboarding est terminé
 * @returns Promise<boolean> - true si la mise à jour a réussi
 */
export async function setOnboardingDone(userId: number, done: boolean): Promise<boolean> {
  try {
    if (!done) {
      console.log('🧹 Reset: Nettoyage cache et marquage pour suppression DB...');

      try {
        const { clearWatchlistCache } = await import('./interaction');
        clearWatchlistCache(userId);
        console.log('📋 Cache watchlist nettoyé immédiatement');
      } catch (e) {
        console.log('Cache invalidation skipped');
      }
    }

    const db = await getDatabase();
    try {
      await db.runAsync('UPDATE user_profile SET onboarding_done = ? WHERE id = ?', [done ? 1 : 0, userId]);
      console.log('✅ Onboarding status mis à jour');

      if (!done) {
        try {
          await db.runAsync('DELETE FROM user_interactions WHERE user_id = ?', [userId]);
          console.log('🗑️ Interactions supprimées de la DB');
        } catch (dbError) {
          console.log('⚠️ DB locked, interactions seront nettoyées plus tard');
        }
      }
    } catch (error) {
      console.log('⚠️ Update onboarding échoué, mais on continue avec le reset');
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'onboarding:', error);
    return false;
  }
}

/**
 * Récupère les mots-clés d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre maximum de mots-clés à retourner (optionnel)
 * @returns Promise<string[]> - Liste des mots-clés
 */
export async function getUserKeywords(userId: number, limit?: number): Promise<string[]> {
  const db = await getDatabase();
  let sql = 'SELECT keyword FROM user_profile WHERE user_id = ?';
  const params: any[] = [userId];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  const result = await db.getAllAsync<{ keyword: string }>(sql, params);
  return result.map(row => row.keyword);
}

/**
 * Met à jour les préférences utilisateur (genres et mots-clés)
 * @param userId - ID de l'utilisateur
 * @param preferences - Préférences à sauvegarder
 * @returns Promise<boolean> - true si la mise à jour a réussi
 */
export async function updateUserPreferences(userId: number, preferences: UserPreferences): Promise<boolean> {
  const db = await getDatabase();

  const preferencesJson = JSON.stringify(preferences.genres);
  const keywordsJson = JSON.stringify(preferences.keywords);

  // Retry mechanism pour éviter le database locked
  let retries = 3;
  while (retries > 0) {
    try {
      await new Promise(resolve => setTimeout(resolve, 50 * (4 - retries))); // Délai croissant

      await db.runAsync(
        'UPDATE user_profile SET preferences = ?, keywords = ? WHERE id = ?',
        [preferencesJson, keywordsJson, userId]
      );

      console.log('✅ Préférences mises à jour avec succès');
      return true;
    } catch (error: any) {
      retries--;
      if (error.message?.includes('database is locked') && retries > 0) {
        console.log(`⏳ DB locked sur préférences, retry ${4 - retries}/3...`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Attendre avant retry
      } else {
        console.error('Erreur lors de la mise à jour des préférences:', error);
        return false;
      }
    }
  }

  console.error('❌ Échec mise à jour préférences après 3 tentatives');
  return false;
}

/**
 * Système de genres dynamiques avec poids (likes vs dislikes)
 * @param userId - ID de l'utilisateur 
 * @param genreIds - IDs des genres à traiter
 * @param action - 'like' ou 'dislike'
 * @returns Promise<boolean> - true si la mise à jour a réussi
 */
export async function manageDynamicGenres(userId: number, genreIds: number[], action: 'like' | 'dislike'): Promise<boolean> {
  if (!genreIds || genreIds.length === 0) return true;

  const db = await getDatabase();
  try {
    // 1. On récupère UNIQUEMENT les poids
    const row = await db.getFirstAsync<{ genre_weights: string | null }>(
      'SELECT genre_weights FROM user_profile WHERE id = ?', [userId]
    );

    let genreWeights: { [key: number]: number } = {};
    if (row && row.genre_weights) {
        genreWeights = JSON.parse(row.genre_weights);
    }

    // 2. On met à jour les scores
    for (const genreId of genreIds) {
      const currentWeight = genreWeights[genreId] || 0;

      if (action === 'like') {
        // On ajoute +1 (Max 100)
        genreWeights[genreId] = Math.min(currentWeight + 1, 100);
      } else { 
        // On retire -0.5
        genreWeights[genreId] = Math.max(currentWeight - 0.5, -5);
      }
    }

    // 3. ON SAUVEGARDE JUSTE LES POIDS (On ne touche pas à la colonne 'preferences')
    await db.runAsync(
      'UPDATE user_profile SET genre_weights = ? WHERE id = ?',
      [JSON.stringify(genreWeights), userId]
    );

    console.log(`⚖️ Poids mis à jour pour User ${userId} (Action: ${action})`);
    return true;
  } catch (error) {
    console.error('Erreur gestion genres dynamiques:', error);
    return false;
  }
}

/**
 * Ajoute des genres aux préférences utilisateur de manière dynamique (compatibilité)
 * @param userId - ID de l'utilisateur 
 * @param genreIds - IDs des genres à ajouter
 * @returns Promise<boolean> - true si l'ajout a réussi
 */
export async function addDynamicGenres(userId: number, genreIds: number[]): Promise<boolean> {
  return manageDynamicGenres(userId, genreIds, 'like');
}

/**
 * Crée un nouveau profil utilisateur
 * @param userId - ID de l'utilisateur
 * @param preferences - Préférences initiales (optionnel)
 * @returns Promise<boolean> - true si la création a réussi
 */
export async function createUserProfile(userId: number, name: string = 'Utilisateur', preferences?: UserPreferences): Promise<boolean> {
  const db = await getDatabase();
  try {
    const preferencesJson = preferences ? JSON.stringify(preferences.genres) : '[]';
    const keywordsJson = preferences ? JSON.stringify(preferences.keywords) : '[]';

    await db.runAsync(
      'INSERT INTO user_profile (id, name, preferences, keywords, onboarding_done) VALUES (?, ?, ?, ?, 0)',
      // @ts-ignore - name param added to function signature in next step or defaulted here
      [userId, name || 'Utilisateur', preferencesJson, keywordsJson]
    );
    return true;
  } catch (error) {
    console.error('Erreur lors de la création du profil utilisateur:', error);
    return false;
  }
}

/**
 * Vérifie si le profil utilisateur existe
 * @returns Promise<boolean> - true si le profil existe
 */
export async function userExists(): Promise<boolean> {
  const db = await getDatabase();
  try {
    const existingUser = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM user_profile WHERE id = ?',
      [CURRENT_USER_ID]
    );
    return !!existingUser;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'existence de l\'utilisateur:', error);
    return false;
  }
}

/**
 * Obtient ou crée le profil utilisateur unique de l'application
 * L'application n'a pas de système de connexion, donc il y a un seul utilisateur avec l'ID 1
 * @returns Promise<number> - ID de l'utilisateur unique (toujours CURRENT_USER_ID = 1)
 */
/**
 * Obtient ou crée le profil utilisateur unique de l'application (LEGACY / FALLBACK)
 * Pour le multi-profil, utilisez getAllUsers() et createNewUser()
 * @returns Promise<number> - ID de l'utilisateur
 */
export async function getOrCreateUser(): Promise<number> {
  const db = await getDatabase();

  try {
    // Essayer de récupérer le dernier utilisateur actif ou le premier trouvé
    const users = await db.getAllAsync<{ id: number }>('SELECT id FROM user_profile LIMIT 1');

    if (users && users.length > 0) {
      return users[0].id;
    }

    // Si aucun utilisateur, créer le premier (ID 1 par défaut)
    await createUserProfile(CURRENT_USER_ID, 'Utilisateur');
    console.log(`Profil utilisateur par défaut créé avec l'ID: ${CURRENT_USER_ID}`);
    return CURRENT_USER_ID;
  } catch (error) {
    console.error('Erreur lors de la récupération/création du profil utilisateur:', error);
    return CURRENT_USER_ID;
  }
}

/**
 * Récupère tous les profils utilisateurs
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const db = await getDatabase();
  try {
    const users = await db.getAllAsync<UserProfile>('SELECT id, name, onboarding_done FROM user_profile');
    return users;
  } catch (error) {
    console.error('Erreur récupération profils:', error);
    return [];
  }
}

/**
 * Crée un nouveau profil utilisateur
 * @param name - Nom du profil
 * @returns Promise<number> - ID du nouvel utilisateur
 */
export async function createNewUser(name: string): Promise<number> {
  const db = await getDatabase();
  try {
    // Insérer un nouvel utilisateur (ID auto-increment implicite si non spécifié, mais ici on gère manuel ou on laisse faire)
    // Comme la table a probablement été créée sans AUTOINCREMENT explicite sur ID si on se basait sur user unique,
    // on va vérifier le max ID actuel + 1
    const maxIdRow = await db.getFirstAsync<{ maxId: number }>('SELECT MAX(id) as maxId FROM user_profile');
    const newId = (maxIdRow?.maxId || 0) + 1;

    await db.runAsync(
      'INSERT INTO user_profile (id, name, preferences, keywords, onboarding_done, language) VALUES (?, ?, ?, ?, 0, ?)',
      [newId, name, '[]', '[]', 'fr']
    );
    console.log(`Nouveau profil créé: ${name} (ID: ${newId})`);
    return newId;
  } catch (error) {
    console.error('Erreur création profil:', error);
    throw error;
  }
}

/**
 * Supprime un profil utilisateur et ses données associées
 * @param userId - ID de l'utilisateur à supprimer
 */
export async function deleteUser(userId: number): Promise<boolean> {
  const db = await getDatabase();
  try {
    // On ne peut pas supprimer s'il ne reste qu'un seul profil ? (Optionnel, à voir)

    await db.runAsync('DELETE FROM user_interactions WHERE user_id = ?', [userId]);
    await db.runAsync('DELETE FROM user_profile WHERE id = ?', [userId]);
    console.log(`Profil supprimé: ID ${userId}`);
    return true;
  } catch (error) {
    console.error('Erreur suppression profil:', error);
    return false;
  }
}

/**
 * Réinitialise complètement les données de l' application
 * Supprime tous les profils et toutes les interactions
 */
export async function resetApplicationData(): Promise<boolean> {
  const db = await getDatabase();
  try {
    await db.runAsync('DELETE FROM user_interactions');
    await db.runAsync('DELETE FROM user_profile');
    // On pourrait aussi dropper les tables si on voulait un hard reset, mais DELETE suffit
    console.log('☢️ RESET COMPLET: Tous les profils et données supprimés');
    return true;
  } catch (error) {
    console.error('Erreur reset application:', error);
    return false;
  }
}

// Mots vides à filtrer lors de l'extraction
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'dans', 'sur',
  'avec', 'sans', 'pour', 'par', 'vers', 'chez', 'très', 'plus', 'moins',
  'tout', 'tous', 'toute', 'toutes', 'ce', 'cet', 'cette', 'ces',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'with', 'for', 'by',
  // Mots génériques à éviter
  'est', 'sont', 'ont', 'ses', 'leur', 'leurs', 'que', 'qui', 'dont', 'où',
  'comme', 'alors', 'aussi', 'bien', 'encore', 'déjà', 'depuis', 'pendant',
  'ann', 'ans', 'année', 'années', 'fois', 'jour', 'jours', 'temps', 'moment',
  'chose', 'choses', 'histoire', 'histoires', 'place', 'fin',
  'part', 'partie', 'parties', 'tre', 'avoir', 'faire', 'dire', 'voir',
  'peut', 'doit', 'veut', 'vont', 'font', 'tous', 'toute', 'après', 'avant',
  'mais', 'donc', 'ainsi', 'entre', 'contre', 'sous', 'avec', 'sans',
  // Fragments courants à éviter
  'premi', 'deuxi', 'troisi', 'alli', 'curit', 'peupl', 'journ', 'ment'
]);

// Mappage genre -> mots-clés associés
const GENRE_KEYWORDS_MAP: { [key: string]: string[] } = {
  'Action': ['combat', 'bataille', 'guerre', 'explosion', 'poursuite', 'héros', 'super', 'martial'],
  'Science Fiction': ['futur', 'espace', 'robot', 'alien', 'technologie', 'vaisseau', 'planète', 'dystopie'],
  'Horror': ['peur', 'mort', 'sang', 'monstre', 'terreur', 'surnaturel', 'démoniaque', 'survie'],
  'Romance': ['amour', 'cœur', 'passion', 'relation', 'mariage', 'couple', 'sentiment', 'romantique'],
  'Comedy': ['drôle', 'humour', 'rire', 'comédie', 'amusant', 'blague', 'satirique', 'comique'],
  'Drama': ['famille', 'vie', 'émotion', 'personnel', 'social', 'psychologique', 'intime', 'profond'],
  'Thriller': ['suspense', 'mystère', 'enquête', 'danger', 'tension', 'crime', 'investigation', 'secret'],
  'Fantasy': ['magie', 'dragon', 'épée', 'royaume', 'quête', 'mythique', 'légende', 'enchantement'],
  'Adventure': ['aventure', 'voyage', 'exploration', 'découverte', 'périple', 'expédition', 'quête', 'évasion']
};

/**
 * Extrait des mots-clés pertinents d'un film
 */
export async function extractKeywordsFromMovie(movie: any, genres: any[]): Promise<string[]> {
  try {
    const keywords = new Set<string>();

    // 1. Extraire du titre (priorité très haute)
    if (movie.title) {
      const titleWords = extractWordsFromText(movie.title)
        .filter(word => word.length >= 3); // Moins strict pour garder plus de mots du titre

      // Prendre TOUS les mots significatifs du titre
      titleWords.forEach(word => {
        if (!STOP_WORDS.has(word)) {
          keywords.add(word);
        }
      });
    }

    // 2. Extraire de l'overview (plus généreux)
    if (movie.overview) {
      const overviewWords = extractWordsFromText(movie.overview)
        .filter(word => word.length >= 4) // Moins strict pour l'overview
        .filter(word => {
          // Privilégier les noms propres, mots significatifs et concepts clés EN FRANÇAIS
          return word[0] === word[0].toUpperCase() ||
            ['robot', 'alien', 'espace', 'bataille', 'magie', 'dragon', 'héros', 'méchant', 'guerre', 'combat', 'quête', 'voyage', 'monde', 'royaume', 'pouvoir', 'secret', 'famille', 'amour', 'mort', 'vengeance', 'justice', 'liberté', 'espoir', 'danger', 'mystère', 'aventure', 'mission', 'destin'].some(term => word.includes(term)) ||
            word.length >= 6; // Garder les mots longs qui sont souvent significatifs
        });

      overviewWords.slice(0, 5).forEach(word => keywords.add(word)); // Passer de 3 à 5
    }

    // 3. Ajouter mots-clés liés aux genres (plus généreux)
    if (genres && genres.length > 0) {
      genres.forEach(genre => {
        const relatedKeywords = GENRE_KEYWORDS_MAP[genre.name] || [];
        // Prendre 2 mots-clés par genre pour plus de contexte
        const selectedKeywords = relatedKeywords
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        selectedKeywords.forEach(keyword => keywords.add(keyword));
      });
    }

    const extractedKeywords = Array.from(keywords)
      .filter(word => word.length >= 3) // Moins strict pour la vérification finale
      .slice(0, 10); // Augmenter à 10 mots-clés pour plus de contexte

    return extractedKeywords;

  } catch (error) {
    console.error('Erreur extraction mots-clés:', error);
    return [];
  }
}

/**
 * Extrait et filtre les mots d'un texte
 */
function extractWordsFromText(text: string): string[] {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, ' ') // Préserve les accents français
    .split(/\s+/) // Divise par les espaces
    .filter(word => word.length >= 4) // Minimum 4 caractères (au lieu de 3)
    .filter(word => !STOP_WORDS.has(word)) // Exclut les mots vides
    .filter(word => !/^\d+$/.test(word)) // Exclut les nombres purs
    .filter(word => !word.includes('`')) // Évite les fragments avec backticks
    .filter(word => !/^(.*ing|.*ed|.*er|.*est)$/.test(word) || word.length > 6) // Évite les terminaisons courtes
    .filter(word => word.match(/^[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]+$/)) // Seulement lettres + accents
    .slice(0, 8); // Limite réduite pour plus de qualité
}

/**
 * Ajoute des mots-clés dynamiques avec système FIFO (max 20)
 */
export async function addDynamicKeywords(userId: number, newKeywords: string[]): Promise<boolean> {
  if (!newKeywords || newKeywords.length === 0) {
    return true;
  }

  const db = await getDatabase();

  try {
    const sql = 'SELECT keywords FROM user_profile WHERE id = ?';
    const row = await db.getFirstAsync<{ keywords: string | null }>(sql, [userId]);

    let keywordData: KeywordData;

    if (!row || !row.keywords) {
      keywordData = { static: [], dynamic: [] };
    } else {
      const parsed = JSON.parse(row.keywords);
      // Migrer l'ancien format vers le nouveau
      if (Array.isArray(parsed)) {
        keywordData = { static: parsed, dynamic: [] };
      } else {
        keywordData = parsed;
      }
    }

    const now = new Date().toISOString();

    // Traiter chaque nouveau mot-clé
    newKeywords.forEach(keyword => {
      const existing = keywordData.dynamic.find(k => k.keyword === keyword);

      if (existing) {
        // Renforcer le mot-clé existant
        existing.weight = Math.min(existing.weight * 1.2, 3.0);
        existing.lastUsed = now;
      } else {
        // Ajouter nouveau mot-clé
        keywordData.dynamic.push({
          keyword: keyword,
          weight: 1.0,
          added: now,
          lastUsed: now
        });
      }
    });

    // Appliquer la limite FIFO (max 20 mots-clés dynamiques)
    if (keywordData.dynamic.length > 20) {
      // Trier par poids (asc) puis par date (asc) et supprimer les plus faibles/anciens
      keywordData.dynamic.sort((a, b) => {
        if (a.weight !== b.weight) return a.weight - b.weight;
        return new Date(a.added).getTime() - new Date(b.added).getTime();
      });
      keywordData.dynamic = keywordData.dynamic.slice(keywordData.dynamic.length - 20);
    }

    // Sauvegarder
    const updateSql = 'UPDATE user_profile SET keywords = ? WHERE id = ?';
    await db.runAsync(updateSql, [JSON.stringify(keywordData), userId]);

    return true;

  } catch (error) {
    console.error('Erreur traitement mots-clés:', error);
    return false;
  }
}

/**
 * Détecte si l'utilisateur est dans une bulle de filtres
 */
export async function detectFilterBubble(userId: number, recentInteractions: any[]): Promise<BubbleDetectionResult> {
  try {
    if (!recentInteractions || recentInteractions.length < 10) {
      return { hasBubble: false, bubbleType: 'none', confidence: 0 };
    }

    // 1. Détection d'over-disliking (70%+ de dislikes)
    const dislikes = recentInteractions.filter(i => i.action === 'dislike').length;
    const dislikeRate = dislikes / recentInteractions.length;

    if (dislikeRate > 0.7) {
      return {
        hasBubble: true,
        bubbleType: 'over_disliking',
        confidence: dislikeRate,
        recommendation: 'reduce_specificity'
      };
    }

    // 2. Détection de saturation de mots-clés (trop spécifiques)
    const db = await getDatabase();
    const sql = 'SELECT keywords FROM user_profile WHERE id = ?';
    const row = await db.getFirstAsync<{ keywords: string | null }>(sql, [userId]);

    if (row && row.keywords) {
      const parsed = JSON.parse(row.keywords);
      if (parsed.dynamic) {
        const highWeightKeywords = parsed.dynamic.filter((k: DynamicKeyword) => k.weight > 2.0).length;
        const totalKeywords = parsed.dynamic.length;

        if (totalKeywords > 15 && highWeightKeywords / totalKeywords > 0.6) {
          return {
            hasBubble: true,
            bubbleType: 'keyword_saturation',
            confidence: highWeightKeywords / totalKeywords,
            recommendation: 'diversify_keywords'
          };
        }
      }
    }

    return { hasBubble: false, bubbleType: 'none', confidence: 0 };

  } catch (error) {
    console.error('Erreur détection bulle:', error);
    return { hasBubble: false, bubbleType: 'none', confidence: 0 };
  }
}

/**
 * Nettoie les mots-clés selon la stratégie anti-bulle
 */
export async function cleanupKeywords(userId: number, bubbleType: string): Promise<boolean> {
  const db = await getDatabase();

  try {
    const sql = 'SELECT keywords FROM user_profile WHERE id = ?';
    const row = await db.getFirstAsync<{ keywords: string | null }>(sql, [userId]);

    if (!row || !row.keywords) {
      return true;
    }

    const keywordData = JSON.parse(row.keywords);

    if (!keywordData.dynamic) {
      return true;
    }

    switch (bubbleType) {
      case 'over_disliking':
        // Réduire le poids des mots-clés les plus spécifiques
        keywordData.dynamic.forEach((k: DynamicKeyword) => {
          if (k.weight > 1.5) {
            k.weight = k.weight * 0.7;
          }
        });
        // Supprimer les 3 mots-clés les plus faibles
        keywordData.dynamic.sort((a: DynamicKeyword, b: DynamicKeyword) => a.weight - b.weight);
        keywordData.dynamic = keywordData.dynamic.slice(3);
        break;

      case 'keyword_saturation':
        // Supprimer 30% des mots-clés les plus anciens
        const toRemove = Math.floor(keywordData.dynamic.length * 0.3);
        keywordData.dynamic.sort((a: DynamicKeyword, b: DynamicKeyword) =>
          new Date(a.added).getTime() - new Date(b.added).getTime());
        keywordData.dynamic = keywordData.dynamic.slice(toRemove);
        break;
    }

    // Sauvegarder
    const updateSql = 'UPDATE user_profile SET keywords = ? WHERE id = ?';
    await db.runAsync(updateSql, [JSON.stringify(keywordData), userId]);

    return true;

  } catch (error) {
    console.error('Erreur nettoyage:', error);
    return false;
  }
}

/**
 * Exporte tous les mots-clés utilisateur sous forme de tableau simple
 * pour compatibilité avec le système existant
 */
export async function exportUserKeywordsToArray(userId: number): Promise<string[]> {
  const db = await getDatabase();

  try {
    const sql = 'SELECT keywords FROM user_profile WHERE id = ?';
    const row = await db.getFirstAsync<{ keywords: string | null }>(sql, [userId]);

    if (!row || !row.keywords) {
      return [];
    }

    const parsed = JSON.parse(row.keywords);
    let allKeywords: string[] = [];

    // Format moderne (objet avec static/dynamic)
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Mots-clés statiques (onboarding)
      if (parsed.static) {
        allKeywords.push(...parsed.static);
      }

      // Mots-clés dynamiques (triés par poids décroissant)
      if (parsed.dynamic) {
        const sortedDynamic = parsed.dynamic
          .filter((k: DynamicKeyword) => k.weight > 0.3) // Seuil minimum
          .sort((a: DynamicKeyword, b: DynamicKeyword) => b.weight - a.weight)
          .map((k: DynamicKeyword) => k.keyword);

        allKeywords.push(...sortedDynamic);
      }
    }
    // Format ancien (tableau simple)
    else if (Array.isArray(parsed)) {
      allKeywords = parsed;
    }

    // Supprimer les doublons et limiter à 15 mots-clés les plus pertinents
    const uniqueKeywords = [...new Set(allKeywords)].slice(0, 15);
    return uniqueKeywords;

  } catch (error) {
    console.error('Erreur export mots-clés:', error);
    return [];
  }
}

/**
 * Extrait les acteurs préférés basés sur les films likés
 * @param userId - ID de l'utilisateur
 * @returns Promise<number[]> - Liste des IDs d'acteurs préférés
 */
export async function getPreferredActors(userId: number): Promise<number[]> {
  const db = await getDatabase();

  try {
    // Récupérer les acteurs des films likés, triés par fréquence
    const sql = `
      SELECT mc.cast_id, c.name, COUNT(*) as frequency
      FROM user_interactions ui
      JOIN movie_cast mc ON ui.movie_id = mc.movie_id
      JOIN cast c ON mc.cast_id = c.id
      WHERE ui.user_id = ? AND ui.action_type IN ('like', 'favorite')
      GROUP BY mc.cast_id
      ORDER BY frequency DESC
      LIMIT 15
    `;

    const actors = await db.getAllAsync<{ cast_id: number, name: string, frequency: number }>(sql, [userId]);
    console.log(`🎭 ${actors.length} acteurs préférés extraits`);

    // ⭐ NOUVEAU : Afficher les noms avec fréquences
    if (actors.length > 0) {
      console.log('🎭 Top acteurs:');
      actors.forEach((actor, i) => {
        console.log(`   ${i + 1}. ${actor.name} (${actor.frequency} films)`);
      });
    }

    return actors.map(a => a.cast_id);
  } catch (error) {
    console.error('Erreur extraction acteurs préférés:', error);
    return [];
  }
}

/**
 * Met à jour le nom d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param newName - Nouveau nom
 * @returns Promise<boolean> - true si la mise à jour a réussi
 */
export async function updateUserName(userId: number, newName: string): Promise<boolean> {
  const db = await getDatabase();
  try {
    // On nettoie le nom (trim) pour éviter les espaces vides
    const cleanedName = newName.trim();
    
    if (cleanedName.length === 0) return false;

    await db.runAsync(
      'UPDATE user_profile SET name = ? WHERE id = ?',
      [cleanedName, userId]
    );

    console.log(`✅ SQL: Nom mis à jour pour ID ${userId} -> "${cleanedName}"`);
    return true;
  } catch (error) {
    console.error('❌ Erreur SQL mise à jour nom:', error);
    return false;
  }
}


export async function clearUserHistory(userId: number): Promise<boolean> {
  const db = await getDatabase();
  try {
    await db.runAsync('DELETE FROM user_interactions WHERE user_id = ?', [userId]);
    console.log(`🧹 Historique nettoyé pour user ${userId}`);
    return true;
  } catch (error) {
    console.error('Erreur nettoyage historique:', error);
    return false;
  }
}

/**
 * Récupère le Top 5 des genres basés sur l'historique des likes (poids calculés)
 * @param userId - ID de l'utilisateur
 * @returns Promise<number[]> - Liste des IDs des 5 meilleurs genres
 */
export async function getTopGenresFromHistory(userId: number): Promise<number[]> {
  const db = await getDatabase();
  try {
    const row = await db.getFirstAsync<{ genre_weights: string | null }>(
      'SELECT genre_weights FROM user_profile WHERE id = ?',
      [userId]
    );

    if (!row || !row.genre_weights) {
      console.log('⚠️ Pas de poids de genres trouvés pour le tri.');
      return [];
    }

    const weights = JSON.parse(row.genre_weights);

    const topGenres = Object.keys(weights)
      .map(key => ({ 
        id: parseInt(key), 
        score: weights[key] 
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.id);

    console.log('🏆 Top 5 genres détectés :', topGenres);
    return topGenres;

  } catch (error) {
    console.error('Erreur récupération top genres:', error);
    return [];
  }
}

export { getDatabase };
