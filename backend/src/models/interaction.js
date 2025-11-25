const db = require('./db');

module.exports = {
	ensureInteractionTable,
	addInteraction,
	getInteractionsByUser,
	getInteractionsByMovie,
	getUserLastInteractions
};

// Table sans rating (simplifiée)
function ensureInteractionTable(callback = () => {}) {
	const sql = `CREATE TABLE IF NOT EXISTS user_interactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		movie_id INTEGER NOT NULL,
		action_type TEXT NOT NULL, -- view | like | dislike | favorite
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`;
	db.run(sql, [], (err) => {
		if (err) console.error('Erreur création table user_interactions:', err.message);
		callback(!err);
	});
}

function addInteraction(userId, movieId, actionType, callback) {
	const sql = 'INSERT INTO user_interactions (user_id, movie_id, action_type) VALUES (?, ?, ?)';
	db.run(sql, [userId, movieId, actionType], function (err) {
		if (err) {
			console.error(err.message);
			return callback(null);
		}
		callback({ id: this.lastID, userId, movieId, actionType });
	});
}

function getInteractionsByUser(userId, callback, limit = null) {
	let sql = 'SELECT * FROM user_interactions WHERE user_id = ? ORDER BY created_at DESC';
	const params = [userId];
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

function getUserLastInteractions(userId, limit, callback) {
	getInteractionsByUser(userId, callback, limit);
}

function getInteractionsByMovie(movieId, callback) {
	const sql = 'SELECT * FROM user_interactions WHERE movie_id = ? ORDER BY created_at DESC';
	db.all(sql, [movieId], (err, rows) => {
		if (err) {
			console.error(err.message);
			return callback([]);
		}
		callback(rows);
	});
}

ensureInteractionTable();
