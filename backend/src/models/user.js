const db = require('./db');

module.exports = {
getUserPreferences,
isOnboardingDone,
setOnboardingDone
}

function getUserPreferences(userId, callback) {
    const sql = 'SELECT preferences, keywords FROM user_profile WHERE id = ?';
    db.get(sql, [userId], (err, row) => {
        if (err || !row) {
            console.error(err ? err.message : 'User not found');
            return callback({ genres: [], keywords: [] });
        }
        const genres = JSON.parse(row.preferences || '[]');
        const keywords = JSON.parse(row.keywords || '[]');
        callback({ genres, keywords });
    });
}

function isOnboardingDone(userId, callback) {
    db.get('SELECT onboarding_done FROM user_profile WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error(err.message);
            return callback(false);
        }
        callback(row ? row.onboarding_done === 1 : false);
    });
}

function setOnboardingDone(userId, done, callback) {
    db.run('UPDATE user_profile SET onboarding_done = ? WHERE id = ?', [done ? 1 : 0, userId], function(err) {
        if (err) {
            console.error(err.message);
            return callback(false);
        }
        callback(true);
    });
}

function getUserKeywords(userId, callback, limit = null) {
    let sql = 'SELECT keyword FROM user_profile WHERE user_id = ?';
    if (limit) {
        sql += ' LIMIT ?';
        db.all(sql, [userId, limit], (err, rows) => {
            if (err) {
                console.error(err.message);
                return callback([]);
            }
            callback(rows.map(row => row.keyword));
        });
    } else {
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                console.error(err.message);
                return callback([]);
            }
            callback(rows.map(row => row.keyword));
        });
    }
}

