const interactionModel = require('../models/interaction');

function addInteraction(userId, movieId, actionType) {
  return new Promise(resolve => interactionModel.addInteraction(userId, movieId, actionType, resolve));
}

function getUserInteractions(userId, limit = null) {
  return new Promise(resolve => interactionModel.getInteractionsByUser(userId, resolve, limit));
}

function getUserLastInteractions(userId, limit = 5) {
  return new Promise(resolve => interactionModel.getUserLastInteractions(userId, limit, resolve));
}

function getMovieInteractions(movieId) {
  return new Promise(resolve => interactionModel.getInteractionsByMovie(movieId, resolve));
}

function health() {
  return new Promise(resolve => interactionModel.ensureInteractionTable(ok => resolve({ ready: ok })));
}

module.exports = {
  addInteraction,
  getUserInteractions,
  getUserLastInteractions,
  getMovieInteractions,
  health
};
