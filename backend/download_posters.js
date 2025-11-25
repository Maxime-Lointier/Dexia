const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('database.db');
const postersDir = path.join(__dirname, 'assets', 'posters');

if (!fs.existsSync(postersDir)) {
    fs.mkdirSync(postersDir, { recursive: true });
}

function downloadImage(url, filepath) {
    return axios({
        url,
        responseType: 'stream',
    }).then(response => {
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    });
}

async function processPosters() {
    db.all('SELECT id, poster_path FROM movies WHERE poster_path IS NOT NULL', async (err, rows) => {
        if (err) {
            console.error(err.message);
            db.close();
            return;
        }
        for (const movie of rows) {
            const tmdbPath = movie.poster_path;
            if (!tmdbPath) continue;
            const url = `https://image.tmdb.org/t/p/w500${tmdbPath}`;
            const localPath = path.join(postersDir, `${movie.id}.jpg`);
            try {
                await downloadImage(url, localPath);
                db.run('UPDATE movies SET poster_path = ? WHERE id = ?', [localPath, movie.id]);
                console.log(`Téléchargé et mis à jour: ${movie.title || movie.id}`);
            } catch (e) {
                console.error(`Erreur téléchargement ${movie.id}:`, e.message);
            }
        }
        db.close();
        console.log('Téléchargement des affiches terminé.');
    });
}

processPosters();
