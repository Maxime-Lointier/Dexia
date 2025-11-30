const moviesModel = require('../models/movies');

// Chaque fonction retourne une Promise pour usage direct dans une app Expo offline.
// Les modèles utilisent des callbacks; ici on les encapsule.

function getMovieById(id) {
  return new Promise(resolve => moviesModel.getMovieById(id, resolve));
}

function searchMovies(keyword) {
  return new Promise(resolve => moviesModel.findMoviesByKeyword(keyword, resolve));
}

function getTopRatedMovies(limit = 10) {
  return new Promise(resolve => moviesModel.getTopRatedMovies(limit, resolve));
}

function getAllGenres() {
  return new Promise(resolve => moviesModel.getAllGenres(resolve));
}

function getMoviesByGenre(genreId, limit = null) {
  return new Promise(resolve => moviesModel.getMoviesByGenre(genreId, resolve, limit));
}

function getGenreIdByName(name) {
  return new Promise(resolve => moviesModel.getGenreIdByName(name, resolve));
}

function getMovieGenreById(movieId) {
  return new Promise(resolve => moviesModel.getMovieGenreById(movieId, resolve));
}

function getMovieGenreIdById(movieId) {
  return new Promise(resolve => moviesModel.getMovieGenreIdById(movieId, resolve));
}

module.exports = {
  getMovieById,
  searchMovies,
  getTopRatedMovies,
  getAllGenres,
  getMoviesByGenre,
  getGenreIdByName,
  getMovieGenreById,
  getMovieGenreIdById
};
