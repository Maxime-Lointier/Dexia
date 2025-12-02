import { getUserPreferences } from '../models/user';
import { getUserSeenMovieIds } from '../models/interaction';
import { Movie } from '../models/movies';
import { getDatabase } from '../models/db';

/**
 * Service de recommandation "Tinder" - Version React Native
 * Adapté depuis backend/src/services/RecommendationService.js
 */

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
 * Récupère des films ciblés selon les préférences utilisateur
 * Équivalent à getMoviesByGenresAndKeywords du backend
 */
async function getTargetedMovies(
  genres: number[], 
  keywords: string[], 
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
             WHERE movie_genres.genre_id IN (${genrePlaceholders})`;
  
  let params: any[] = [...genres];
  
  // Ajouter les mots-clés avec LIKE (PLUS SOUPLE pour plus de résultats)
  let keywordBonus = '';
  if (keywords && keywords.length > 0) {
    // Prendre seulement les 5 mots-clés les plus récents pour éviter sur-filtrage
    const recentKeywords = keywords.slice(0, 5);
    const keywordConditions = recentKeywords.map(() => 'movies.overview LIKE ?').join(' OR ');
    sql += ` AND (${keywordConditions})`;
    params.push(...recentKeywords.map(k => `%${k}%`));
    
    keywordBonus = `, CASE WHEN (${keywordConditions}) THEN 0.3 ELSE 0 END AS keyword_bonus`;
  }
  
  // SCORING SOPHISTIQUÉ BACKEND : 70% qualité + 30% popularité + bonus mots-clés
  sql += ` ORDER BY ((movies.vote_average * 0.7 + (movies.popularity * 0.01) * 0.3)${keywordBonus ? ' + keyword_bonus' : ''}) DESC`;
  
  // Augmenter beaucoup la limite pour compenser le gros filtrage
  const sqlLimit = limit ? limit * 5 : 50;
  sql += ' LIMIT ?';
  params.push(sqlLimit);
  
  // 🔧 EXCLURE EN POST-TRAITEMENT pour éviter les bugs SQL avec sous-requêtes
  let movies = await db.getAllAsync<Movie>(sql, params);
  
  // Filtrer en JavaScript pour être 100% sûr
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
  
  // Augmenter beaucoup la limite pour compenser le gros filtrage
  const sqlLimit = limit ? limit * 5 : 50;
  sql += ' LIMIT ?';
  params.push(sqlLimit);
  
  // 🔧 EXCLURE EN POST-TRAITEMENT pour éviter les bugs SQL avec sous-requêtes
  let movies = await db.getAllAsync<Movie>(sql, params);
  
  // Filtrer en JavaScript pour être 100% sûr
  if (excludeIds && excludeIds.length > 0) {
    movies = movies.filter(movie => !excludeIds.includes(movie.id));
  }
  
  return movies.slice(0, limit || movies.length);
}

/**
 * FONCTION PRINCIPALE - Algorithme de recommandation "Tinder"
 * 🚀 Version React Native de backend/src/services/RecommendationService.js
 */
export async function getTinderRecommendations(userId: number): Promise<Movie[]> {
  console.log(`\n=== 🎯 RECOMMANDATION ALGORITHME BACKEND POUR USER ${userId} ===`);
  
  try {
    // 1. Récupérer préférences utilisateur (genres + mots-clés dynamiques)
    const preferences = await getUserPreferences(userId);
    console.log('Préférences utilisateur:', {
      genres: preferences.genres?.length || 0,
      keywords: preferences.keywords?.length || 0
    });
    
    // 2. Récupérer films déjà vus
    const seenIds = await getUserSeenMovieIds(userId);
    console.log('Films déjà vus:', seenIds.length);
    console.log('Quelques IDs exclus:', seenIds.slice(-10)); // Les 10 derniers
    
    // 3. Obtenir 7 films CIBLÉS (selon préférences)
    const targetedMovies = await getTargetedMovies(
      preferences.genres || [], 
      preferences.keywords || [], 
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
    console.log('=== ✅ FIN ALGORITHME BACKEND ===');
    
    // 6. Fallback si pas assez de films
    if (shuffledMovies.length === 0) {
      console.log('⚠️ Aucune recommandation, fallback vers films aléatoires');
      const db = await getDatabase();
      let fallbackMovies = await db.getAllAsync<Movie>(
        'SELECT * FROM movies ORDER BY RANDOM() LIMIT 10'
      );
      
      // Filtrer les films déjà vus
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