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

function isOnboardingDone(userId, callback) {
    db.get('SELECT onboarding_done FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error(err.message);
            return callback(false);
        }
        callback(row ? row.onboarding_done === 1 : false);
    });
}

function setOnboardingDone(userId, done, callback) {
    db.run('UPDATE users SET onboarding_done = ? WHERE id = ?', [done ? 1 : 0, userId], function(err) {
        if (err) {
            console.error(err.message);
            return callback(false);
        }
        callback(true);
    });
}
