import { getDatabase } from './db';

export interface Cast {
  id: number;
  name: string;
  profile_path: string | null;
  role: string;
}

/**
 * Récupère le casting d'un film
 * @param movieId - ID du film
 * @returns Promise<Cast[]> - Liste des acteurs
 */
export async function getMovieCast(movieId: number): Promise<Cast[]> {
  const db = await getDatabase();
  const sql = `
    SELECT c.id, c.name, c.profile_path, mc.role 
    FROM "cast" c
    JOIN movie_cast mc ON c.id = mc.cast_id 
    WHERE mc.movie_id = ?
  `;
  const result = await db.getAllAsync<Cast>(sql, [movieId]);
  return result;
}

