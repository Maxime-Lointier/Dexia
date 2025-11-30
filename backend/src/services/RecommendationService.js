const userModel = require('../models/user');
const interactionModel = require('../models/interaction');
const moviesModel = require('../models/movies');

// Mélange un tableau
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Fonction principale de recommandation "tinder"
function getTinderRecommendations(userId, callback) {
    console.log(`\n=== DEBUG RECOMMANDATION POUR USER ${userId} ===`);
    
    userModel.getUserPreferences(userId, (prefs) => {
        console.log('Préférences utilisateur:', prefs);
        
        interactionModel.getUserSeenMovieIds(userId, (seenIds) => {
            console.log('Films déjà vus:', seenIds);
            
            moviesModel.getMoviesByGenresAndKeywords(prefs.genres, prefs.keywords, seenIds, 7, (targeted) => {
                console.log(`Films ciblés trouvés: ${targeted.length}`);
                if (targeted.length > 0) {
                    console.log('Exemple films ciblés:', targeted.slice(0, 3).map(m => m.title));
                }
                
                moviesModel.getMoviesOutsideGenres(prefs.genres, seenIds, 3, (different) => {
                    console.log(`Films différents trouvés: ${different.length}`);
                    if (different.length > 0) {
                        console.log('Exemple films différents:', different.slice(0, 3).map(m => m.title));
                    }
                    
                    const all = shuffle([...targeted, ...different]);
                    console.log(`Total final: ${all.length} films (${targeted.length} ciblés + ${different.length} différents)`);
                    console.log('=== FIN DEBUG ===\n');
                    callback(all);
                });
            });
        });
    });
}

module.exports = {
    getTinderRecommendations
};