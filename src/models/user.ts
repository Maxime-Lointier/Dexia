import { getDatabase } from './db';

// ID de l'utilisateur unique de l'application
export const CURRENT_USER_ID = 1;

export interface UserPreferences {
  genres: number[];
  keywords: string[];
}

export interface UserProfile {
  id: number;
  preferences?: string;
  keywords?: string;
  onboarding_done?: number;
}

/**
 * Récupère les préférences utilisateur (genres et mots-clés)
 * @param userId - ID de l'utilisateur
 * @returns Promise<UserPreferences> - Préférences de l'utilisateur
 */
export async function getUserPreferences(userId: number): Promise<UserPreferences> {
  const db = await getDatabase();
  const sql = 'SELECT preferences, keywords FROM user_profile WHERE id = ?';
  const row = await db.getFirstAsync<{ preferences: string | null; keywords: string | null }>(sql, [userId]);
  
  if (!row) {
    return { genres: [], keywords: [] };
  }
  
  const genres = row.preferences ? JSON.parse(row.preferences) : [];
  const keywords = row.keywords ? JSON.parse(row.keywords) : [];
  
  return { genres, keywords };
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
  const db = await getDatabase();
  try {
    await db.runAsync('UPDATE user_profile SET onboarding_done = ? WHERE id = ?', [done ? 1 : 0, userId]);
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
  try {
    const preferencesJson = JSON.stringify(preferences.genres);
    const keywordsJson = JSON.stringify(preferences.keywords);
    
    await db.runAsync(
      'UPDATE user_profile SET preferences = ?, keywords = ? WHERE id = ?',
      [preferencesJson, keywordsJson, userId]
    );
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    return false;
  }
}

/**
 * Crée un nouveau profil utilisateur
 * @param userId - ID de l'utilisateur
 * @param preferences - Préférences initiales (optionnel)
 * @returns Promise<boolean> - true si la création a réussi
 */
export async function createUserProfile(userId: number, preferences?: UserPreferences): Promise<boolean> {
  const db = await getDatabase();
  try {
    const preferencesJson = preferences ? JSON.stringify(preferences.genres) : '[]';
    const keywordsJson = preferences ? JSON.stringify(preferences.keywords) : '[]';
    
    await db.runAsync(
      'INSERT INTO user_profile (id, preferences, keywords, onboarding_done) VALUES (?, ?, ?, 0)',
      [userId, preferencesJson, keywordsJson]
    );
    return true;
  } catch (error) {
    console.error('Erreur lors de la création du profil utilisateur:', error);
    return false;
  }
}

/**
 * Obtient ou crée le profil utilisateur unique de l'application
 * L'application n'a pas de système de connexion, donc il y a un seul utilisateur avec l'ID 1
 * @returns Promise<number> - ID de l'utilisateur unique (toujours CURRENT_USER_ID = 1)
 */
export async function getOrCreateUser(): Promise<number> {
  const db = await getDatabase();
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM user_profile WHERE id = ?',
      [CURRENT_USER_ID]
    );
    
    if (existingUser) {
      return CURRENT_USER_ID;
    }
    
    // Si l'utilisateur n'existe pas, le créer
    await createUserProfile(CURRENT_USER_ID);
    console.log(`Profil utilisateur créé avec l'ID: ${CURRENT_USER_ID}`);
    return CURRENT_USER_ID;
  } catch (error) {
    console.error('Erreur lors de la récupération/création du profil utilisateur:', error);
    // En cas d'erreur, retourner quand même l'ID utilisateur
    return CURRENT_USER_ID;
  }
}

