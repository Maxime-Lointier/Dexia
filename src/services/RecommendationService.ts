import { getUserPreferences } from '../models/user';
import { getUserSeenMovieIds } from '../models/interaction';
import { Movie } from '../models/movies';
import { getDatabase } from '../models/db';

/**
 * Service de recommandation "Tinder" - Version React Native
 * Adapté depuis backend/src/services/RecommendationService.js
 * 
 **/

// Mélange un tableau
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 
 * Équivalent amélioré de getMoviesByGenresAndKeywords du backend
 */
async function getTargetedMovies(
  genres: number[],
  keywords: string[],
  actors: number[], // ← NOUVEAU
  directors: number[], // ← NOUVEAU
  excludeIds: number[],
  limit: number
): Promise<Movie[]> {
  if (!genres || genres.length === 0) {
    return [];
  }

  const db = await getDatabase();

  // Construire la requête avec placeholders
  const genrePlaceholders = genres.map(() => '?').join(',');
  let sql = `SELECT DISTINCT movies.*
             FROM movies
             JOIN movie_genres ON movies.id = movie_genres.movie_id
             LEFT JOIN movie_cast mc ON movies.id = mc.movie_id
             LEFT JOIN movie_directors md ON movies.id = md.movie_id
             WHERE movie_genres.genre_id IN (${genrePlaceholders})`;

  let params: any[] = [...genres];

  // Bonus mots-clés
  let keywordBonus = '';
  if (keywords && keywords.length > 0) {
    const recentKeywords = keywords.slice(0, 5);
    const keywordConditions = recentKeywords.map(() => 'movies.overview LIKE ?').join(' OR ');
    sql += ` AND (${keywordConditions})`;
    params.push(...recentKeywords.map(k => `%${k}%`));
    keywordBonus = `, CASE WHEN (${keywordConditions}) THEN 0.15 ELSE 0 END AS keyword_bonus`;
  }

  
  let actorBonus = '';
  if (actors && actors.length > 0) {
    const actorPlaceholders = actors.map(() => '?').join(',');
    actorBonus = `, CASE WHEN mc.cast_id IN (${actorPlaceholders}) THEN 0.3 ELSE 0 END AS actor_bonus`;
    params.push(...actors);
  }

  let directorBonus = '';
  if (directors && directors.length > 0) {
    const directorPlaceholders = directors.map(() => '?').join(',');
    directorBonus = `, CASE WHEN md.director_id IN (${directorPlaceholders}) THEN 0.25 ELSE 0 END AS director_bonus`;
    params.push(...directors);
  }

  // SCORING AMÉLIORÉ :
  // 40% qualité + 20% popularité + 30% acteurs + 15% mots-clés + 25% réalisateurs
  // Note: Les bonus peuvent se cumuler mais le total reste cohérent grâce aux poids
  sql += ` ORDER BY (
    (movies.vote_average * 0.4) +
    (movies.popularity * 0.01 * 0.2)
    ${actorBonus ? ' + actor_bonus' : ''}
    ${directorBonus ? ' + director_bonus' : ''}
    ${keywordBonus ? ' + keyword_bonus' : ''}
  ) DESC`;

  // Augmenter la limite pour compenser le filtrage
  const sqlLimit = limit ? limit * 5 : 50;
  sql += ' LIMIT ?';
  params.push(sqlLimit);

  // Exclure en post-traitement
  let movies = await db.getAllAsync<Movie>(sql, params);

  if (excludeIds && excludeIds.length > 0) {
    movies = movies.filter(movie => !excludeIds.includes(movie.id));
  }

  return movies.slice(0, limit || movies.length);
}

/**
 * Récupère des films de découverte (hors genres préférés)
 * Équivalent à getMoviesOutsideGenres du backend
 */
async function getDiscoveryMovies(
  genres: number[],
  excludeIds: number[],
  limit: number
): Promise<Movie[]> {
  const db = await getDatabase();

  let sql = 'SELECT DISTINCT movies.* FROM movies WHERE 1=1';
  let params: any[] = [];

  // Exclure les genres préférés
  if (genres && genres.length > 0) {
    const genrePlaceholders = genres.map(() => '?').join(',');
    sql += ` AND movies.id NOT IN (
                SELECT movie_id FROM movie_genres
                WHERE genre_id IN (${genrePlaceholders})
             )`;
    params.push(...genres);
  }

  // SCORING SOPHISTIQUÉ BACKEND : 60% qualité + 40% popularité (plus populaire pour découverte)
  sql += ' ORDER BY (movies.vote_average * 0.6 + (movies.popularity * 0.01) * 0.4) DESC';

  const sqlLimit = limit ? limit * 5 : 50;
  sql += ' LIMIT ?';
  params.push(sqlLimit);

  let movies = await db.getAllAsync<Movie>(sql, params);

  if (excludeIds && excludeIds.length > 0) {
    movies = movies.filter(movie => !excludeIds.includes(movie.id));
  }

  return movies.slice(0, limit || movies.length);
}

/**
 * FONCTION PRINCIPALE - Algorithme de recommandation "Tinder"
 * 🚀 Version React Native avec ACTEURS et RÉALISATEURS
 */
export async function getTinderRecommendations(userId: number): Promise<Movie[]> {
  console.log(`\n=== 🎯 RECOMMANDATION AVEC ACTEURS/RÉALISATEURS POUR USER ${userId} ===`);

  try {
    // 1. Récupérer préférences utilisateur (genres + mots-clés + acteurs + réalisateurs)
    const preferences = await getUserPreferences(userId);
    console.log('Préférences utilisateur:', {
      genres: preferences.genres?.length || 0,
      keywords: preferences.keywords?.length || 0,
      actors: preferences.actors?.length || 0, // ← NOUVEAU
      directors: preferences.directors?.length || 0 // ← NOUVEAU
    });

    // 2. Récupérer films déjà vus
    const seenIds = await getUserSeenMovieIds(userId);
    console.log('Films déjà vus:', seenIds.length);

    // 3. Obtenir 7 films CIBLÉS (selon préférences + acteurs + réalisateurs)
    const targetedMovies = await getTargetedMovies(
      preferences.genres || [],
      preferences.keywords || [],
      preferences.actors || [], // ← NOUVEAU
      preferences.directors || [], // ← NOUVEAU
      seenIds,
      7
    );
    console.log(`Films ciblés trouvés: ${targetedMovies.length}`);
    if (targetedMovies.length > 0) {
      console.log('Exemple films ciblés:', targetedMovies.slice(0, 3).map(m => m.title));
    }

    // 4. Obtenir 3 films DÉCOUVERTE (autres genres)
    const discoveryMovies = await getDiscoveryMovies(
      preferences.genres || [],
      seenIds,
      3
    );
    console.log(`Films découverte trouvés: ${discoveryMovies.length}`);
    if (discoveryMovies.length > 0) {
      console.log('Exemple films découverte:', discoveryMovies.slice(0, 3).map(m => m.title));
    }

    // 5. Combiner et mélanger
    const allMovies = [...targetedMovies, ...discoveryMovies];
    const shuffledMovies = shuffle(allMovies);

    console.log(`🎬 Total final: ${shuffledMovies.length} films (${targetedMovies.length} ciblés + ${discoveryMovies.length} découverte)`);
    console.log('=== ✅ FIN ALGORITHME AMÉLIORÉ ===');

    // 6. Fallback si pas assez de films
    if (shuffledMovies.length === 0) {
      console.log('⚠️ Aucune recommandation, fallback vers films aléatoires');
      const db = await getDatabase();
      let fallbackMovies = await db.getAllAsync<Movie>(
        'SELECT * FROM movies ORDER BY RANDOM() LIMIT 10'
      );

      if (seenIds.length > 0) {
        fallbackMovies = fallbackMovies.filter(movie => !seenIds.includes(movie.id));
      }

      return fallbackMovies.slice(0, 10);
    }

    return shuffledMovies;
  } catch (error) {
    console.error('Erreur dans getTinderRecommendations:', error);

    // Fallback ultime
    const db = await getDatabase();
    const fallbackMovies = await db.getAllAsync<Movie>(
      'SELECT * FROM movies ORDER BY vote_average DESC LIMIT 10'
    );
    return fallbackMovies;
  }
}