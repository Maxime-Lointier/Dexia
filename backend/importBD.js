const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');
const { getAllGenres, getMoviesByGenre } = require('./src/models/api');
const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function importMovies() {
	// 1. Importer les genres
	const genres = await getAllGenres();
	for (const genre of genres) {
		db.run(
			`INSERT OR IGNORE INTO genres (id, name) VALUES (?, ?)`,
			[genre.id, genre.name]
		);
	}

	// 2. Importer les films par genre (40 films = pages 1 et 2)
	const importedMovieIds = new Set();
	for (const genre of genres) {
		let movies = [];
		for (let page = 1; page <= 5; page++) {
            const pageMovies = await getMoviesByGenre(genre.id, page);
			movies = movies.concat(pageMovies);
		}
		for (const movie of movies) {
			if (!importedMovieIds.has(movie.id)) {
				db.run(
					`INSERT OR IGNORE INTO movies (id, title, overview, release_date, vote_average, poster_path, popularity, is_tv)
					 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
					[
						movie.id,
						movie.title,
						movie.overview,
						movie.release_date,
						movie.vote_average,
						movie.poster_path,
						movie.popularity
					]
				);
				importedMovieIds.add(movie.id);
			}
			// 3. Lier le film au genre
			db.run(
				`INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)`,
				[movie.id, genre.id]
			);
		}
		console.log(`Importé ${movies.length} films pour le genre ${genre.name}`);
	}

	console.log(`Import terminé. Films uniques importés : ${importedMovieIds.size}`);
	db.close();
}

importMovies();
