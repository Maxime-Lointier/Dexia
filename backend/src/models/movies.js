const db = require('./db');

module.exports = {
    getMoviesByGenre,
    getGenreIdByName,
    getMovieGenreIdById,
    getMovieGenreById,
    getTopRatedMovies,
    getAllGenres,
    getMovieById,
    findMoviesByKeyword,
    getMoviesByGenresAndKeywords,
    getMoviesOutsideGenres
}

//dans beaucoup de ces fonctions, on utilise des callbacks pour gérer l'asynchronicité des requêtes SQL, alors on doit les uitliser diféremment dans les fichiers qui les appellent.

function getMoviesByGenre(genreId, callback, limit = null) {
    let sql = 'SELECT movies.* FROM movies JOIN movie_genres ON movies.id = movie_genres.movie_id WHERE movie_genres.genre_id = ?';
    if (limit) {
        sql += ' LIMIT ?';
        db.all(sql, [genreId, limit], (err, rows) => {
            if (err) {
                console.error(err.message);
                return callback([]);
            }
            callback(rows);
        });
    } else {
        db.all(sql, [genreId], (err, rows) => {
            if (err) {
                console.error(err.message);
                return callback([]);
            }
            callback(rows);
        });
    }
}

function getGenreIdByName(name, callback) {
    db.get('SELECT id FROM genres WHERE name = ?', [name], (err, row) => {
        if (err) return callback(null);
        callback(row ? row.id : null);
    });
}

function getMovieGenreIdById(movieId, callback) {
    db.all('SELECT genre_id FROM movie_genres WHERE movie_id = ?', [movieId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return callback([]);
        }
        callback(rows.map(row => row.genre_id));
    });
}

function getMovieGenreById(movieId, callback) {
    db.all('SELECT genres.* FROM genres JOIN movie_genres ON genres.id = movie_genres.genre_id WHERE movie_genres.movie_id = ?', [movieId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return callback([]);
        }
        callback(rows);
    });
}

function getAllGenres(callback) {
    db.all('SELECT * FROM genres', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return callback([]);
        }
        callback(rows);
    });
}

function getMovieById(movieId, callback) {
    db.get('SELECT * FROM movies WHERE id = ?', [movieId], (err, row) => {
        if (err) {
            console.error(err.message);
            return callback(null);
        }
        callback(row);
    });
}

function findMoviesByKeyword(keyword, callback) {
    const sql = 'SELECT * FROM movies WHERE title LIKE ? OR overview LIKE ?';
    const param = `%${keyword}%`;
    db.all(sql, [param, param], (err, rows) => {
        if (err) {
            console.error(err.message);
            return callback([]);
        }
        callback(rows);
    });
}

function getTopRatedMovies(limit, callback) {
    const sql = 'SELECT * FROM movies ORDER BY vote_average DESC LIMIT ?';
    db.all(sql, [limit], (err, rows) => {
        if (err) {
            console.error(err.message);
            return callback([]);
        }
        callback(rows);
    });
}

function getMoviesByGenresAndKeywords(genres, keywords, excludeIds, limit, callback) {
    if (!genres || genres.length === 0) {
        return callback([]);
    }
    
    // Construire la clause WHERE pour les genres
    const genrePlaceholders = genres.map(() => '?').join(',');
    let sql = `SELECT DISTINCT movies.*
               FROM movies 
               JOIN movie_genres ON movies.id = movie_genres.movie_id 
               WHERE movie_genres.genre_id IN (${genrePlaceholders})
               AND movies.vote_average >= 5.0
               AND movies.vote_average <= 8.5
               AND movies.popularity > 5.0`; // Films décents mais pas trop obscurs
    
    let params = [...genres];
    
    // Recherche de mots-clés avec LIKE (compatible SQLite)
    if (keywords && keywords.length > 0) {
        const keywordConditions = keywords.map(() => '(movies.title LIKE ? OR movies.overview LIKE ?)').join(' OR ');
        sql += ` AND (${keywordConditions})`;
        keywords.forEach(keyword => {
            const likePattern = `%${keyword}%`;
            params.push(likePattern, likePattern);
        });
    }
    
    // Exclure les films déjà vus
    if (excludeIds && excludeIds.length > 0) {
        const excludePlaceholders = excludeIds.map(() => '?').join(',');
        sql += ` AND movies.id NOT IN (${excludePlaceholders})`;
        params.push(...excludeIds);
    }
    
    sql += ' ORDER BY (movies.vote_average * 0.7 + LOG(movies.popularity + 1) * 0.3) DESC';
    
    if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return callback([]);
        }
        callback(rows);
    });
}

function getMoviesOutsideGenres(genres, excludeIds, limit, callback) {
    let sql = 'SELECT DISTINCT movies.* FROM movies WHERE movies.vote_average >= 6.0 AND movies.vote_average <= 8.5 AND movies.popularity > 10.0'; // Films décents et populaires
    let params = [];
    
    // Exclure les genres préférés
    if (genres && genres.length > 0) {
        const genrePlaceholders = genres.map(() => '?').join(',');
        sql += ` AND movies.id NOT IN (
                    SELECT movie_id FROM movie_genres 
                    WHERE genre_id IN (${genrePlaceholders})
                 )`;
        params.push(...genres);
    }
    
    // Exclure les films déjà vus
    if (excludeIds && excludeIds.length > 0) {
        const excludePlaceholders = excludeIds.map(() => '?').join(',');
        if (genres && genres.length > 0) {
            sql += ` AND movies.id NOT IN (${excludePlaceholders})`;
        } else {
            sql += ` WHERE movies.id NOT IN (${excludePlaceholders})`;
        }
        params.push(...excludeIds);
    }
    
    sql += ' ORDER BY (movies.vote_average * 0.6 + LOG(movies.popularity + 1) * 0.4) DESC';
    
    if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return callback([]);
        }
        callback(rows);
    });
}

