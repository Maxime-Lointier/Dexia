import { getDatabase } from './db';

export type ActionType = 'view' | 'like' | 'dislike' | 'favorite' | 'watchlist';

// Cache simple pour la watchlist
interface WatchlistCache {
  [userId: number]: {
    movieIds: number[];
    movies: any[];
    lastUpdate: number;
  };
}

const watchlistCache: WatchlistCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fonction pour invalider le cache d'un utilisateur
function invalidateWatchlistCache(userId: number) {
  delete watchlistCache[userId];
}

// Export pour permettre l'invalidation depuis d'autres modules
export function clearWatchlistCache(userId: number) {
  console.log(`📋 Invalidation du cache pour user ${userId}`);
  // Supprimer complètement le cache - pas de cache vide persistant
  delete watchlistCache[userId];
  console.log(`📋 Cache watchlist complètement supprimé pour user ${userId}`);
}

export interface UserInteraction {
  id: number;
  user_id: number;
  movie_id: number;
  action_type: ActionType;
  created_at: string;
}

/**
 * Crée la table user_interactions si elle n'existe pas
 * @returns Promise<boolean> - true si la table existe ou a été créée
 */
export async function ensureInteractionTable(): Promise<boolean> {
  const db = await getDatabase();
  try {
    const tableExists = await db.getFirstAsync('SELECT name FROM sqlite_master WHERE type="table" AND name="user_interactions"');
    
    if (tableExists) {
      const tableInfo = await db.getAllAsync('PRAGMA table_info(user_interactions)');
      const hasUserId = tableInfo.some((col: any) => col.name === 'user_id');
      
      if (!hasUserId) {
        console.log('Migration: Recreation de la table user_interactions (manque user_id)');
        try {
          await db.execAsync('DROP TABLE user_interactions');
        } catch (e) {
          console.log('Erreur lors du DROP TABLE:', e);
        }
      } else {
        return true;
      }
    }

    const sql = `CREATE TABLE IF NOT EXISTS user_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;
    await db.execAsync(sql);
    return true;
  } catch (error) {
    console.error('Erreur création/migration table user_interactions:', error);
    return false;
  }
}

/**
 * Ajoute une interaction utilisateur
 * @param userId - ID de l'utilisateur
 * @param movieId - ID du film
 * @param actionType - Type d'action (view, like, dislike, favorite)
 * @returns Promise<UserInteraction | null> - L'interaction créée ou null en cas d'erreur
 */
export async function addInteraction(
  userId: number,
  movieId: number,
  actionType: ActionType
): Promise<UserInteraction | null> {
  const db = await getDatabase();
  
  // S'assurer que la table existe
  await ensureInteractionTable();
  
  try {
    const sql = 'INSERT INTO user_interactions (user_id, movie_id, action_type) VALUES (?, ?, ?)';
    const result = await db.runAsync(sql, [userId, movieId, actionType]);
    
    const interaction = await db.getFirstAsync<UserInteraction>(
      'SELECT * FROM user_interactions WHERE id = ?',
      [result.lastInsertRowId]
    );
    
    return interaction || null;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'interaction:', error);
    return null;
  }
}

/**
 * Récupère les interactions d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre maximum d'interactions à retourner (optionnel)
 * @returns Promise<UserInteraction[]> - Liste des interactions
 */
export async function getInteractionsByUser(userId: number, limit?: number): Promise<UserInteraction[]> {
  const db = await getDatabase();
  let sql = 'SELECT * FROM user_interactions WHERE user_id = ? ORDER BY created_at DESC';
  const params: any[] = [userId];
  
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  
  const result = await db.getAllAsync<UserInteraction>(sql, params);
  return result;
}

/**
 * Récupère les dernières interactions d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param limit - Nombre maximum d'interactions à retourner
 * @returns Promise<UserInteraction[]> - Liste des interactions
 */
export async function getUserLastInteractions(userId: number, limit: number): Promise<UserInteraction[]> {
  return getInteractionsByUser(userId, limit);
}

/**
 * Récupère les interactions pour un film
 * @param movieId - ID du film
 * @returns Promise<UserInteraction[]> - Liste des interactions
 */
export async function getInteractionsByMovie(movieId: number): Promise<UserInteraction[]> {
  const db = await getDatabase();
  const sql = 'SELECT * FROM user_interactions WHERE movie_id = ? ORDER BY created_at DESC';
  const result = await db.getAllAsync<UserInteraction>(sql, [movieId]);
  return result;
}

/**
 * Récupère les IDs des films vus par un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Promise<number[]> - Liste des IDs de films vus
 */
export async function getUserSeenMovieIds(userId: number): Promise<number[]> {
  const db = await getDatabase();
  const sql = 'SELECT DISTINCT movie_id FROM user_interactions WHERE user_id = ?';
  const result = await db.getAllAsync<{ movie_id: number }>(sql, [userId]);
  return result.map(row => row.movie_id);
}

/**
 * Vérifie si un utilisateur a déjà interagi avec un film
 * @param userId - ID de l'utilisateur
 * @param movieId - ID du film
 * @param actionType - Type d'action à vérifier (optionnel)
 * @returns Promise<boolean> - true si l'interaction existe
 */
export async function hasUserInteractedWithMovie(
  userId: number,
  movieId: number,
  actionType?: ActionType
): Promise<boolean> {
  const db = await getDatabase();
  let sql = 'SELECT COUNT(*) as count FROM user_interactions WHERE user_id = ? AND movie_id = ?';
  const params: any[] = [userId, movieId];
  
  if (actionType) {
    sql += ' AND action_type = ?';
    params.push(actionType);
  }
  
  const result = await db.getFirstAsync<{ count: number }>(sql, params);
  return result ? result.count > 0 : false;
}

/**
 * Supprime une interaction
 * @param interactionId - ID de l'interaction à supprimer
 * @returns Promise<boolean> - true si la suppression a réussi
 */
export async function deleteInteraction(interactionId: number): Promise<boolean> {
  const db = await getDatabase();
  try {
    await db.runAsync('DELETE FROM user_interactions WHERE id = ?', [interactionId]);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'interaction:', error);
    return false;
  }
}

/**
 * Ajoute ou retire un film de la watchlist de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param movieId - ID du film
 * @returns Promise<boolean> - true si l'action a réussi
 */
export async function toggleWatchlist(userId: number, movieId: number): Promise<boolean> {
  const db = await getDatabase();
  
  try {
    // Vérifier si le film est déjà dans la watchlist
    const exists = await hasUserInteractedWithMovie(userId, movieId, 'watchlist');
    
    if (exists) {
      // Supprimer de la watchlist
      const sql = 'DELETE FROM user_interactions WHERE user_id = ? AND movie_id = ? AND action_type = ?';
      await db.runAsync(sql, [userId, movieId, 'watchlist']);
    } else {
      // Ajouter à la watchlist
      const result = await addInteraction(userId, movieId, 'watchlist');
      if (!result) return false;
    }
    
    // Invalider complètement le cache après modification
    delete watchlistCache[userId];
    console.log(`📋 Cache watchlist invalidé après toggle pour user ${userId}`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors du toggle watchlist:', error);
    return false;
  }
}

/**
 * Vérifie si un film est dans la watchlist de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param movieId - ID du film
 * @returns Promise<boolean> - true si le film est dans la watchlist
 */
export async function isInWatchlist(userId: number, movieId: number): Promise<boolean> {
  return hasUserInteractedWithMovie(userId, movieId, 'watchlist');
}

/**
 * Récupère les IDs des films dans la watchlist de l'utilisateur (avec cache)
 * @param userId - ID de l'utilisateur
 * @returns Promise<number[]> - Liste des IDs de films dans la watchlist
 */
export async function getWatchlistMovieIds(userId: number): Promise<number[]> {
  // Vérifier le cache d'abord (seulement s'il existe et est valide)
  const cached = watchlistCache[userId];
  if (cached && Date.now() - cached.lastUpdate < CACHE_DURATION) {
    console.log(`📋 Cache watchlist utilisé: ${cached.movieIds.length} films`);
    return cached.movieIds;
  }

  console.log(`📋 Pas de cache valide, requête DB (cache exists: ${!!cached})`);
  if (cached) {
    console.log(`📋 Cache age: ${Date.now() - cached.lastUpdate}ms (max: ${CACHE_DURATION}ms)`);
  }

  const db = await getDatabase();
  try {
    const sql = 'SELECT movie_id FROM user_interactions WHERE user_id = ? AND action_type = ? ORDER BY created_at DESC';
    console.log(`📋 Requête DB watchlist pour user ${userId}`);
    const result = await db.getAllAsync<{ movie_id: number }>(sql, [userId, 'watchlist']);
    console.log(`📋 Résultat DB: ${result.length} entrées`);
    const movieIds = result.map(row => row.movie_id);
    console.log(`📋 IDs films watchlist: [${movieIds.join(', ')}]`);
    
    // Mettre en cache les nouveaux IDs
    watchlistCache[userId] = {
      movieIds,
      movies: [], // Sera rempli par getWatchlistMovies
      lastUpdate: Date.now()
    };
    
    return movieIds;
  } catch (error) {
    console.error('Erreur lors de la récupération des IDs watchlist:', error);
    return [];
  }
}

/**
 * Compte le nombre de films dans la watchlist de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Promise<number> - Nombre de films dans la watchlist
 */
export async function getWatchlistCount(userId: number): Promise<number> {
  // Si le cache existe, utiliser la longueur des IDs mis en cache
  const cached = watchlistCache[userId];
  if (cached && Date.now() - cached.lastUpdate < CACHE_DURATION) {
    console.log(`📋 Count depuis cache: ${cached.movieIds.length}`);
    return cached.movieIds.length;
  }

  const db = await getDatabase();
  try {
    const sql = 'SELECT COUNT(*) as count FROM user_interactions WHERE user_id = ? AND action_type = ?';
    console.log(`📋 Count depuis DB pour user ${userId}`);
    const result = await db.getFirstAsync<{ count: number }>(sql, [userId, 'watchlist']);
    const count = result ? result.count : 0;
    console.log(`📋 Count DB résultat: ${count}`);
    return count;
  } catch (error) {
    console.error('Erreur lors du comptage watchlist:', error);
    return 0;
  }
}

/**
 * Compte le nombre de films likés par l'utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Promise<number> - Nombre de films likés
 */
export async function getLikeCount(userId: number): Promise<number> {
  try {
    const db = await getDatabase();
    
    // Vérifier que la base de données est bien initialisée
    if (!db) {
      console.warn('⚠️ Base de données non initialisée pour getLikeCount');
      return 0;
    }

    const sql = 'SELECT COUNT(*) as count FROM user_interactions WHERE user_id = ? AND action_type = ?';
    const result = await db.getFirstAsync<{ count: number }>(sql, [userId, 'like']);
    const count = result ? result.count : 0;
    console.log(`❤️ Count likes DB: ${count} pour user ${userId}`);
    return count;
  } catch (error: any) {
    console.error('Erreur lors du comptage des likes:', error);
    // En cas d'erreur de DB, retourner 0 au lieu de faire planter l'app
    return 0;
  }
}

/**
 * Récupère les films complets de la watchlist de l'utilisateur (avec cache)
 * @param userId - ID de l'utilisateur
 * @returns Promise<Movie[]> - Liste des films de la watchlist avec détails complets
 */
export async function getWatchlistMovies(userId: number): Promise<any[]> {
  try {
    console.log(`📋 getWatchlistMovies appelé pour user ${userId}`);
    
    const movieIds = await getWatchlistMovieIds(userId);
    console.log(`📋 IDs récupérés: [${movieIds.join(', ')}]`);
    
    if (movieIds.length === 0) {
      console.log(`📋 Aucun film dans la watchlist`);
      // Vider le cache s'il n'y a pas de films
      if (watchlistCache[userId]) {
        watchlistCache[userId].movies = [];
      }
      return [];
    }

    // Vérifier le cache films seulement si les IDs correspondent
    const cached = watchlistCache[userId];
    if (cached && cached.movies.length === movieIds.length && cached.movies.length > 0) {
      console.log(`📋 Cache films utilisé: ${cached.movies.length} films`);
      return cached.movies;
    }

    // Recharger les films depuis la DB
    console.log(`📋 Rechargement films depuis DB`);
    const { getMoviesByIds } = await import('./movies');
    const movies = await getMoviesByIds(movieIds);
    console.log(`📋 Films récupérés: ${movies.length} films trouvés`);
    
    // Mettre à jour le cache avec les films complets
    if (watchlistCache[userId]) {
      watchlistCache[userId].movies = movies;
      watchlistCache[userId].lastUpdate = Date.now();
    }
    
    return movies;
  } catch (error) {
    console.error('Erreur lors de la récupération des films watchlist:', error);
    return [];
  }
}

/**
 * Retire un film de la watchlist de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param movieId - ID du film
 * @returns Promise<boolean> - true si la suppression a réussi
 */
export async function removeFromWatchlist(userId: number, movieId: number): Promise<boolean> {
  const db = await getDatabase();
  try {
    const sql = 'DELETE FROM user_interactions WHERE user_id = ? AND movie_id = ? AND action_type = ?';
    await db.runAsync(sql, [userId, movieId, 'watchlist']);
    
    // Invalider le cache après suppression
    invalidateWatchlistCache(userId);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la watchlist:', error);
    return false;
  }
}

/**
 * Nettoie les interactions d'un utilisateur si l'onboarding n'est pas terminé
 * @param userId - ID de l'utilisateur
 */
export async function cleanupInteractionsIfNeeded(userId: number): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Vérifier le statut onboarding directement en base
    const result = await db.getFirstAsync<{ onboarding_done: number }>(
      'SELECT onboarding_done FROM user_profile WHERE id = ?', 
      [userId]
    );
    
    // Si l'onboarding n'est pas terminé, nettoyer les interactions
    if (!result?.onboarding_done) {
      console.log('🧹 Nettoyage automatique des interactions (onboarding non terminé)');
      await db.runAsync('DELETE FROM user_interactions WHERE user_id = ?', [userId]);
      
      // Vider le cache aussi
      clearWatchlistCache(userId);
      console.log('✅ Interactions nettoyées au démarrage');
    }
  } catch (error) {
    console.log('⚠️ Erreur nettoyage automatique, pas grave');
  }
}

// Initialiser la table au chargement du module
ensureInteractionTable();

