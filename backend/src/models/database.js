const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../../database.db');

module.exports = {
    getMoviesByGenre,
    getGenreIdByName,
    getMovieGenreIdById,
    getMovieGenreById,
    getTopRatedMovies,
    getAllGenres,
    getMovieById,
    findMoviesByKeyword
}

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

