import { getDatabase } from './db';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string;
  backdrop_path?: string;
  [key: string]: any;
}

export interface Genre {
  id: number;
  name: string;
}

// Convertir les fonctions avec callbacks en Promises pour React Native

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

export async function getGenreIdByName(name: string): Promise<number | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ id: number }>('SELECT id FROM genres WHERE name = ?', [name]);
  return result ? result.id : null;
}

export async function getMovieGenreIdById(movieId: number): Promise<number[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<{ genre_id: number }>('SELECT genre_id FROM movie_genres WHERE movie_id = ?', [movieId]);
  return result.map(row => row.genre_id);
}

export async function getMovieGenreById(movieId: number): Promise<Genre[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Genre>(
    'SELECT genres.* FROM genres JOIN movie_genres ON genres.id = movie_genres.genre_id WHERE movie_genres.movie_id = ?',
    [movieId]
  );
  return result;
}

export async function getAllGenres(): Promise<Genre[]> {
  const db = await getDatabase();
  const result = await db.getAllAsync<Genre>('SELECT * FROM genres', []);
  return result;
}

export async function getMovieById(movieId: number): Promise<Movie | null> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Movie>('SELECT * FROM movies WHERE id = ?', [movieId]);
  return result || null;
}

export async function findMoviesByKeyword(keyword: string): Promise<Movie[]> {
  const db = await getDatabase();
  const sql = 'SELECT * FROM movies WHERE title LIKE ? OR overview LIKE ?';
  const param = `%${keyword}%`;
  const result = await db.getAllAsync<Movie>(sql, [param, param]);
  return result;
}

export async function getTopRatedMovies(limit: number): Promise<Movie[]> {
  const db = await getDatabase();
  const sql = 'SELECT * FROM movies ORDER BY vote_average DESC LIMIT ?';
  const result = await db.getAllAsync<Movie>(sql, [limit]);
  return result;
}

