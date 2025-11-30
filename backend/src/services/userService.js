const userModel = require('../models/user');

function getUserPreferences(userId) {
  return new Promise(resolve => userModel.getUserPreferences(userId, resolve));
}

function isOnboardingDone(userId) {
  return new Promise(resolve => userModel.isOnboardingDone(userId, resolve));
}

function setOnboardingDone(userId, done) {
  return new Promise(resolve => userModel.setOnboardingDone(userId, done, resolve));
}

module.exports = {
  getUserPreferences,
  isOnboardingDone,
  setOnboardingDone
};
