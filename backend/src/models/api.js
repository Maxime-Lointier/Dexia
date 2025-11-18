require('dotenv').config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const axios = require('axios');

module.exports = {
    getPopularMovies,
    getTopRatedMovies,
    getAllGenres,
    getMoviesByGenre,
    getMovieById,
    searchMovies
};

async function getPopularMovies() { //retourne un tableu d'objets' 
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`;
  try {
    const promise = await axios.get(url);
    return promise.data.results;
  } catch (error) {
    console.error("Erreur lors de la récupération des films populaires :", error);
    return [];
  }
}

async function getTopRatedMovies() { 
    const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`;
    try{
        const promise = await axios.get(url);
        return promise.data.results;
    }
    catch (error){
        console.error("Erreur lors de la récupération des films les mieux notés :", error);
        return [];
    }
}

async function getAllGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=fr-FR`;
    try {
        const promise = await axios.get(url);
        return promise.data.genres;
    } catch (error) {
        console.error("Erreur lors de la récupération des genres :", error);
        return [];
    }
}

async function getMoviesByGenre(genreId, page = 1) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&language=fr-FR&page=${page}`;
    try {
        const promise = await axios.get(url);
        return promise.data.results;
    } catch (error) {
        console.error(`Erreur lors de la récupération des films pour le genre ID ${genreId}, page ${page} :`, error);
        return [];
    }
}

async function getMovieById(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=fr-FR`;
    try {
        const promise = await axios.get(url);
        return promise.data;
    } catch (error) {
        console.error(`Erreur lors de la récupération du film ID ${movieId} :`, error);
        return null;
    }
}

async function searchMovies(keyword) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(keyword)}&page=1&include_adult=false`;
    try {
        const promise = await axios.get(url);
        return promise.data.results;
    } catch (error) {
        console.error(`Erreur lors de la recherche de films avec la requête "${keyword}" :`, error);
        return [];
    }
}

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

db.all('SELECT id, poster_path FROM movies LIMIT 10;', [], (err, rows) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log(rows); // Affiche tous les films sous forme de tableau d’objets
    db.close();
});


