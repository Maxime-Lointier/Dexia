import { getDatabase } from './db';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string;
  backdrop_path?: string;
  popularity?: number;
  [key: string]: any;
}

export interface Genre {
  id: number;
  name: string;
}

/**
 * Récupère les films par genre
 * @param genreId - ID du genre
 * @param limit - Nombre maximum de films à retourner (optionnel)
 * @returns Promise<Movie[]> - Liste des films
 */
export async function getMoviesByGenre(genreId: number, limit?: number): Promise<Movie[]> {
  const db = await getDatabase();
  let sql = 'SELECT movies.* FROM movies JOIN movie_genres ON movies.id = movie_genres.movie_id WHERE movie_genres.genre_id = ?';
  
  if (limit) {
    sql += ' LIMIT ?';
    const result = await db.getAllAsync(sql, [genreId, limit]);
    return result as Movie[];
  } else {
    const result = await db.getAllAsync(sql, [genreId]);
    return result as Movie[];
  }
}

/**
 * Récupère l'ID d'un genre par son nom
 * @param name - Nom du genre
 * @returns Promise<number | null> - ID du genre ou null
 */
export async function getGenreIdByName(name: string): Promise<number | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ id: number }>('SELECT id FROM genres WHERE name = ?', [name]);
  return result ? result.id : null;
}

/**
 * Récupère les IDs des genres d'un film
 * @param movieId - ID du film
 * @returns Promise<number[]> - Liste des IDs de genres
 */
export async function getMovieGenreIdById(movieId: number): Promise<number[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<{ genre_id: number }>('SELECT genre_id FROM movie_genres WHERE movie_id = ?', [movieId]);
  return result.map(row => row.genre_id);
}

/**
 * Récupère les genres d'un film
 * @param movieId - ID du film
 * @returns Promise<Genre[]> - Liste des genres
 */
export async function getMovieGenreById(movieId: number): Promise<Genre[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Genre>(
    'SELECT DISTINCT genres.* FROM genres JOIN movie_genres ON genres.id = movie_genres.genre_id WHERE movie_genres.movie_id = ?',
    [movieId]
  );
  return result;
}

/**
 * Récupère tous les genres
 * @returns Promise<Genre[]> - Liste de tous les genres
 */
export async function getAllGenres(): Promise<Genre[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Genre>('SELECT * FROM genres', []);
  return result;
}

/**
 * Récupère un film par son ID
 * @param movieId - ID du film
 * @returns Promise<Movie | null> - Le film ou null
 */
export async function getMovieById(movieId: number): Promise<Movie | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Movie>('SELECT * FROM movies WHERE id = ?', [movieId]);
  return result || null;
}

/**
 * Recherche des films par mot-clé dans le titre ou la description
 * @param keyword - Mot-clé à rechercher
 * @returns Promise<Movie[]> - Liste des films correspondants
 */
export async function findMoviesByKeyword(keyword: string): Promise<Movie[]> {
  const db = await getDatabase();
  const sql = 'SELECT * FROM movies WHERE title LIKE ? OR overview LIKE ?';
  const param = `%${keyword}%`;
  const result = await db.getAllAsync<Movie>(sql, [param, param]);
  return result;
}

/**
 * Récupère des films aléatoires
 * @param limit - Nombre de films à retourner
 * @returns Promise<Movie[]> - Liste de films aléatoires
 */
export async function getRandomMovies(limit: number): Promise<Movie[]> {
  const db = await getDatabase();
  const sql = 'SELECT * FROM movies ORDER BY RANDOM() LIMIT ?';
  const result = await db.getAllAsync<Movie>(sql, [limit]);
  return result;
}

/**
 * Récupère les films les mieux notés
 * @param limit - Nombre maximum de films à retourner
 * @returns Promise<Movie[]> - Liste des films triés par note
 */
export async function getTopRatedMovies(limit: number): Promise<Movie[]> {
  const db = await getDatabase();
  const sql = 'SELECT * FROM movies ORDER BY vote_average DESC LIMIT ?';
  const result = await db.getAllAsync<Movie>(sql, [limit]);
  return result;
}

/**
 * Récupère des films par genres et mots-clés avec filtres avancés
 * @param genres - Liste des IDs de genres
 * @param keywords - Liste des mots-clés à rechercher (optionnel)
 * @param excludeIds - Liste des IDs de films à exclure (optionnel)
 * @param limit - Nombre maximum de films à retourner (optionnel)
 * @returns Promise<Movie[]> - Liste des films correspondants
 */
export async function getMoviesByGenresAndKeywords(
  genres: number[],
  keywords?: string[],
  excludeIds?: number[],
  limit?: number,
  likedGenreIds?: number[]
): Promise<Movie[]> {
  if ((!genres || genres.length === 0) && (!likedGenreIds || likedGenreIds.length === 0)) {
    return [];
  }

  const db = await getDatabase();
  
  let allEligibleGenres = [...genres];
  if (likedGenreIds && likedGenreIds.length > 0) {
    const newGenres = likedGenreIds.filter(id => !genres.includes(id));
    allEligibleGenres = [...genres, ...newGenres];
  }
  
  const genrePlaceholders = allEligibleGenres.map(() => '?').join(',');
  
  let sql = `SELECT DISTINCT movies.*, (movies.vote_average * 0.7 + (movies.popularity / 100.0) * 0.3) as base_score
             FROM movies 
             JOIN movie_genres ON movies.id = movie_genres.movie_id 
             WHERE movie_genres.genre_id IN (${genrePlaceholders})
             AND movies.vote_average >= 5.0
             AND movies.popularity > 5.0`;
  
  let params: any[] = [...allEligibleGenres];
  
  if (keywords && keywords.length > 0) {
    const keywordConditions = keywords.map(() => '(movies.title LIKE ? OR movies.overview LIKE ?)').join(' OR ');
    sql += ` AND (${keywordConditions})`;
    keywords.forEach(keyword => {
      const likePattern = `%${keyword}%`;
      params.push(likePattern, likePattern);
    });
  }
  
  if (excludeIds && excludeIds.length > 0) {
    const excludePlaceholders = excludeIds.map(() => '?').join(',');
    sql += ` AND movies.id NOT IN (${excludePlaceholders})`;
    params.push(...excludeIds);
  }
  
  sql += ' ORDER BY base_score DESC';
  
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  
  const result = await db.getAllAsync<Movie>(sql, params);
  
  if (likedGenreIds && likedGenreIds.length > 0) {
     return result.sort(() => Math.random() - 0.3);
  }
  
  return result;
}

/**
 * Récupère des films en dehors des genres spécifiés
 * @param genres - Liste des IDs de genres à exclure (optionnel)
 * @param excludeIds - Liste des IDs de films à exclure (optionnel)
 * @param limit - Nombre maximum de films à retourner (optionnel)
 * @returns Promise<Movie[]> - Liste des films correspondants
 */
export async function getMoviesOutsideGenres(
  genres?: number[],
  excludeIds?: number[],
  limit?: number
): Promise<Movie[]> {
  const db = await getDatabase();
  let sql = 'SELECT DISTINCT movies.* FROM movies WHERE movies.vote_average >= 6.0 AND movies.vote_average <= 8.5 AND movies.popularity > 10.0';
  let params: any[] = [];
  
  if (genres && genres.length > 0) {
    const genrePlaceholders = genres.map(() => '?').join(',');
    sql += ` AND movies.id NOT IN (
                SELECT movie_id FROM movie_genres 
                WHERE genre_id IN (${genrePlaceholders})
             )`;
    params.push(...genres);
  }
  
  if (excludeIds && excludeIds.length > 0) {
    const excludePlaceholders = excludeIds.map(() => '?').join(',');
    if (genres && genres.length > 0) {
      sql += ` AND movies.id NOT IN (${excludePlaceholders})`;
    } else {
      sql += ` WHERE movies.id NOT IN (${excludePlaceholders})`;
    }
    params.push(...excludeIds);
  }
  
  sql += ' ORDER BY (movies.vote_average * 0.6 + (movies.popularity / 100.0) * 0.4) DESC';
  
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  
  const result = await db.getAllAsync<Movie>(sql, params);
  return result;
}

/**
 * Récupère plusieurs films par leurs IDs
 * @param movieIds - Liste des IDs de films à récupérer
 * @returns Promise<Movie[]> - Liste des films correspondants
 */
export async function getMoviesByIds(movieIds: number[]): Promise<Movie[]> {
  if (!movieIds || movieIds.length === 0) {
    return [];
  }

  const db = await getDatabase();
  try {
    const placeholders = movieIds.map(() => '?').join(',');
    const sql = `SELECT * FROM movies WHERE id IN (${placeholders}) ORDER BY vote_average DESC`;
    const result = await db.getAllAsync<Movie>(sql, movieIds);
    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des films par IDs:', error);
    return [];
  }
}

