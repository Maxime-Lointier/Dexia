function showStats() {
    const tables = ['movies', 'genres', 'cast', 'movie_cast', 'movie_genres'];
    let remaining = tables.length;
    tables.forEach(table => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
            if (err) {
                console.error(`Erreur lors du comptage de ${table} :`, err.message);
            } else {
                console.log(`Table ${table} : ${row.count} lignes`);
            }
            remaining--;
            if (remaining === 0) {
                db.close();
            }
        });
    });
}
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const db = new sqlite3.Database('database.db');

function checkTable(table, callback) {
    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
        if (err) {
            console.error(`Erreur lors de la vérification de la table ${table} :`, err.message);
            callback(false);
        } else {
            callback(row.count > 0);
        }
    });
}

async function getMovieCast(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=fr-FR`;
    try {
        const response = await axios.get(url);
        return response.data.cast;
    } catch (error) {
        console.error(`Erreur récupération cast pour le film ${movieId} :`, error.message);
        return [];
    }
}

async function importCast() {
    db.all('SELECT id FROM movies', async (err, movies) => {
        if (err) {
            console.error('Erreur récupération films :', err.message);
            db.close();
            return;
        }
        for (const movie of movies) {
            const castList = await getMovieCast(movie.id);
            for (const actor of castList) {
                db.run(
                    `INSERT OR IGNORE INTO cast (id, name, profile_path) VALUES (?, ?, ?)`,
                    [actor.id, actor.name, actor.profile_path]
                );
                db.run(
                    `INSERT OR IGNORE INTO movie_cast (movie_id, cast_id, role) VALUES (?, ?, ?)`,
                    [movie.id, actor.id, actor.character]
                );
            }
            console.log(`Importé ${castList.length} acteurs pour le film ${movie.id}`);
        }
        db.close();
        console.log('Import du casting terminé.');
    });
}

function main() {
    checkTable('cast', hasData => {
        if (hasData) {
            console.log('La table cast contient déjà des données.');
            showStats();
        } else {
            console.log('La table cast est vide, import en cours...');
            importCast();
        }
    });
}

main();
