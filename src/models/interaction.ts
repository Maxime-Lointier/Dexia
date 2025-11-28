import { getDatabase } from './db';

export type ActionType = 'view' | 'like' | 'dislike' | 'favorite';

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

// Initialiser la table au chargement du module
ensureInteractionTable();

