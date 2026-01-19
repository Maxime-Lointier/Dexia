import { getUserPreferences } from '../models/user';
import { getUserSeenMovieIds } from '../models/interaction';
import { Movie } from '../models/movies';
import { getDatabase } from '../models/db';

/**
 * Service de recommandation "Tinder" - Version React Native
 * ⭐ Avec bonus ACTEURS préférés
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
 * ⭐ Récupère des films ciblés avec bonus ACTEURS
 */
async function getTargetedMovies(
  genres: number[],
  keywords: string[],
  actors: number[],
  excludeIds: number[],
  limit: number
): Promise<Movie[]> {
  if (!genres || genres.length === 0) {
    return [];
  }

  const db = await getDatabase();

  const genrePlaceholders = genres.map(() => '?').join(',');

  // Construction SQL progressive
  let sql = `SELECT DISTINCT movies.*`;
  let params: any[] = [];

  // Bonus acteurs si disponibles
  let actorBonus = '';
  if (actors && actors.length > 0) {
    const actorPlaceholders = actors.map(() => '?').join(',');
    actorBonus = `, MAX(CASE WHEN mc.cast_id IN (${actorPlaceholders}) THEN 0.35 ELSE 0 END) AS actor_bonus`;
    params.push(...actors);
  }

  sql += `${actorBonus}
          FROM movies 
          JOIN movie_genres ON movies.id = movie_genres.movie_id`;

  // LEFT JOIN seulement si on a des acteurs à chercher
  if (actors && actors.length > 0) {
    sql += ` LEFT JOIN movie_cast mc ON movies.id = mc.movie_id`;
  }

  sql += ` WHERE movie_genres.genre_id IN (${genrePlaceholders})`;
  params.push(...genres);

  // Bonus mots-clés
  let keywordBonus = '';
  if (keywords && keywords.length > 0) {
    const recentKeywords = keywords.slice(0, 5);
    const keywordConditions = recentKeywords.map(() => 'movies.overview LIKE ?').join(' OR ');
    sql += ` AND (${keywordConditions})`;
    params.push(...recentKeywords.map(k => `%${k}%`));
    keywordBonus = `, MAX(CASE WHEN (${keywordConditions}) THEN 0.2 ELSE 0 END) AS keyword_bonus`;
  }

  // Grouper pour éviter les doublons avec les JOIN
  sql += ` GROUP BY movies.id`;

  // SCORING : 45% qualité + 20% popularité + 35% acteurs + 20% mots-clés
  sql += ` ORDER BY (
    (movies.vote_average * 0.45) + 
    (movies.popularity * 0.01 * 0.2)
    ${actorBonus ? ' + actor_bonus' : ''}
    ${keywordBonus ? ' + keyword_bonus' : ''}
  ) DESC`;

  const sqlLimit = limit ? limit * 5 : 50;
  sql += ' LIMIT ?';
  params.push(sqlLimit);

  let movies = await db.getAllAsync<Movie>(sql, params);

  // 🎭 LOGS DÉTAILLÉS : Influence des acteurs
  if (actors && actors.length > 0 && movies.length > 0) {
    console.log('\n🎭 === ANALYSE INFLUENCE ACTEURS ===');

    // Pour chaque film, vérifier quels acteurs matchent
    for (let i = 0; i < Math.min(5, movies.length); i++) {
      const movie = movies[i];

      // Récupérer les acteurs de ce film
      const castSql = `
        SELECT c.id, c.name 
        FROM cast c
        JOIN movie_cast mc ON c.id = mc.cast_id
        WHERE mc.movie_id = ?
      `;
      const movieCast = await db.getAllAsync<{id: number, name: string}>(castSql, [movie.id]);

      // Trouver les acteurs qui matchent avec les préférences
      const matchingActors = movieCast.filter(actor => actors.includes(actor.id));

      const qualityScore = (movie.vote_average * 0.45).toFixed(2);
      const popularityScore = ((movie.popularity || 0) * 0.01 * 0.2).toFixed(2);
      const actorBonusValue = matchingActors.length > 0 ? '0.35' : '0.00';

      console.log(`\n📽️ Film #${i+1}: "${movie.title}"`);
      console.log(`   ⭐ Qualité: ${qualityScore} (vote: ${movie.vote_average})`);
      console.log(`   📈 Popularité: ${popularityScore}`);
      console.log(`   🎭 Bonus acteurs: ${actorBonusValue}`);

      if (matchingActors.length > 0) {
        console.log(`   ✅ Acteurs matchés (${matchingActors.length}): ${matchingActors.map(a => a.name).join(', ')}`);
      } else {
        console.log(`   ❌ Aucun acteur préféré dans ce film`);
      }

      const totalScore = (
        parseFloat(qualityScore) + 
        parseFloat(popularityScore) + 
        parseFloat(actorBonusValue)
      ).toFixed(2);
      console.log(`   🎯 Score total: ${totalScore}`);
    }

    console.log('\n=== FIN ANALYSE ACTEURS ===\n');
  }

  if (excludeIds && excludeIds.length > 0) {
    movies = movies.filter(movie => !excludeIds.includes(movie.id));
  }

  return movies.slice(0, limit || movies.length);
}

/**
 * Récupère des films de découverte (hors genres préférés)
 */
async function getDiscoveryMovies(
  genres: number[],
  excludeIds: number[],
  limit: number
): Promise<Movie[]> {
  const db = await getDatabase();

  let sql = 'SELECT DISTINCT movies.* FROM movies WHERE 1=1';
  let params: any[] = [];

  if (genres && genres.length > 0) {
    const genrePlaceholders = genres.map(() => '?').join(',');
    sql += ` AND movies.id NOT IN (
                SELECT movie_id FROM movie_genres 
                WHERE genre_id IN (${genrePlaceholders})
             )`;
    params.push(...genres);
  }

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
 * 🚀 Avec bonus acteurs préférés
 */
export async function getTinderRecommendations(userId: number): Promise<Movie[]> {
  console.log(`\n=== 🎯 RECOMMANDATION AVEC ACTEURS POUR USER ${userId} ===`);
  
  try {
    // 1. Récupérer préférences utilisateur (genres + mots-clés + acteurs)
    const preferences = await getUserPreferences(userId);
    console.log('📊 Préférences utilisateur:', {
      genres: preferences.genres?.length || 0,
      keywords: preferences.keywords?.length || 0,
      actors: preferences.actors?.length || 0
    });
    
    if (preferences.actors?.length > 0) {
      console.log(`🎭 Top acteurs préférés (IDs): ${preferences.actors.slice(0, 5).join(', ')}${preferences.actors.length > 5 ? '...' : ''}`);
      
      // Récupérer les noms des acteurs pour les afficher
      const db = await getDatabase();
      const actorIds = preferences.actors.slice(0, 5);
      const actorPlaceholders = actorIds.map(() => '?').join(',');
      const actorNames = await db.getAllAsync<{name: string}>(
        `SELECT name FROM cast WHERE id IN (${actorPlaceholders})`,
        actorIds
      );
      console.log(`🎭 Noms: ${actorNames.map(a => a.name).join(', ')}`);
    }
    
    // 2. Récupérer films déjà vus
    const seenIds = await getUserSeenMovieIds(userId);
    console.log('📽️ Films déjà vus:', seenIds.length);
    
    // 3. Obtenir 7 films CIBLÉS (selon préférences + acteurs)
    const targetedMovies = await getTargetedMovies(
      preferences.genres || [], 
      preferences.keywords || [], 
      preferences.actors || [],
      seenIds, 
      7
    );
    console.log(`🎯 Films ciblés trouvés: ${targetedMovies.length}`);
    if (targetedMovies.length > 0) {
      console.log('   Exemples:', targetedMovies.slice(0, 3).map(m => m.title).join(', '));
    }
    
    // 4. Obtenir 3 films DÉCOUVERTE (autres genres)
    const discoveryMovies = await getDiscoveryMovies(
      preferences.genres || [], 
      seenIds, 
      3
    );
    console.log(`🔍 Films découverte trouvés: ${discoveryMovies.length}`);
    if (discoveryMovies.length > 0) {
      console.log('   Exemples:', discoveryMovies.slice(0, 3).map(m => m.title).join(', '));
    }
    
    // 5. Combiner et mélanger
    const allMovies = [...targetedMovies, ...discoveryMovies];
    const shuffledMovies = shuffle(allMovies);
    
    console.log(`🎬 Total final: ${shuffledMovies.length} films (${targetedMovies.length} ciblés + ${discoveryMovies.length} découverte)`);
    console.log('=== ✅ FIN ALGORITHME ===\n');
    
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
    console.error('❌ Erreur dans getTinderRecommendations:', error);
    
    // Fallback ultime
    const db = await getDatabase();
    const fallbackMovies = await db.getAllAsync<Movie>(
      'SELECT * FROM movies ORDER BY vote_average DESC LIMIT 10'
    );
    return fallbackMovies;
  }
}