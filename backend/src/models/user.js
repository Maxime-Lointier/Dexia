const db = require('./db');

module.exports = {
getUserPreferences
}

function getUserPreferences(userId, callback, limit = null) {
    let sql = 'SELECT genre_id FROM user_preferences WHERE user_id = ?';
    if (limit) {
        sql += ' LIMIT ?';
        db.all(sql, [userId, limit], (err, rows) => {
            if (err) {
                console.error(err.message);
                return callback([]);
            }
        });
    } else {
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                console.error(err.message);
                return callback([]);
            }
            callback(rows.map(row => row.genre_id));
        });
    }
}