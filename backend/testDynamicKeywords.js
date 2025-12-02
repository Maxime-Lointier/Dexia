const { addDynamicKeywords, extractKeywordsFromMovie, detectFilterBubble, cleanupKeywords, exportUserKeywordsToArray } = require('./src/models/user');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Film de test Matrix
const testMovie = {
    id: 603,
    title: "Matrix",
    overview: "Neo is a young software engineer and part-time hacker who is singled out by some mysterious figures who want to introduce him to the secret of 'the matrix'. The truth that he discovers is more incredible than he ever imagined."
};

// Genres de test pour Matrix
const testGenres = [
    { name: 'Action' },
    { name: 'Science Fiction' }
];

function createTestUser(callback) {
    console.log('--- Création utilisateur de test ---');
    
    const userId = 1;
    const initialPrefs = {
        static: ["space", "future"],
        dynamic: []
    };
    
    const insertUserSQL = `
        INSERT OR REPLACE INTO user_profile (id, preferences, keywords, onboarding_done) 
        VALUES (?, ?, ?, 1)
    `;
    
    db.run(insertUserSQL, [
        userId, 
        JSON.stringify([28, 12, 878]), // Action, Adventure, Science Fiction
        JSON.stringify(initialPrefs)
    ], function(err) {
        if (err) {
            console.error('Erreur création utilisateur:', err.message);
        } else {
            console.log(`Utilisateur ${userId} créé avec succès`);
            console.log('Mots-clés initiaux:', initialPrefs);
        }
        callback();
    });
}

async function testKeywordExtraction() {
    console.log('\n--- Test d\'extraction de mots-clés ---');
    
    extractKeywordsFromMovie(testMovie, testGenres, (extractedKeywords) => {
        console.log('Film:', testMovie.title);
        console.log('Genres:', testGenres.map(g => g.name).join(', '));
        console.log('Mots-clés extraits:', extractedKeywords);
        
        // Test d'ajout des mots-clés dynamiques
        if (extractedKeywords.length > 0) {
            addDynamicKeywords(1, extractedKeywords, (success) => {
                if (success) {
                    console.log('✅ Mots-clés ajoutés avec succès');
                    
                    // Vérifier le résultat
                    exportUserKeywordsToArray(1, (allKeywords) => {
                        console.log('Tous les mots-clés utilisateur:', allKeywords);
                        
                        // Test de détection de bulle
                        testBubbleDetection();
                    });
                } else {
                    console.log('❌ Erreur lors de l\'ajout des mots-clés');
                }
            });
        }
    });
}

function testBubbleDetection() {
    console.log('\n--- Test de détection de bulle ---');
    
    // Simuler des interactions récentes avec beaucoup de dislikes
    const recentInteractions = [
        { action: 'dislike', movie_id: 1 },
        { action: 'dislike', movie_id: 2 },
        { action: 'dislike', movie_id: 3 },
        { action: 'dislike', movie_id: 4 },
        { action: 'dislike', movie_id: 5 },
        { action: 'dislike', movie_id: 6 },
        { action: 'dislike', movie_id: 7 },
        { action: 'dislike', movie_id: 8 },
        { action: 'like', movie_id: 9 },
        { action: 'like', movie_id: 10 }
    ];
    
    detectFilterBubble(1, recentInteractions, (result) => {
        console.log('Résultat détection de bulle:', result);
        
        if (result.hasBubble) {
            console.log(`🎯 Bulle détectée: ${result.bubbleType} (confiance: ${result.confidence.toFixed(2)})`);
            
            // Test de nettoyage
            cleanupKeywords(1, result.bubbleType, (cleanupSuccess) => {
                if (cleanupSuccess) {
                    console.log('🧹 Nettoyage des mots-clés réussi');
                    
                    // Vérifier le résultat après nettoyage
                    exportUserKeywordsToArray(1, (cleanedKeywords) => {
                        console.log('Mots-clés après nettoyage:', cleanedKeywords);
                    });
                } else {
                    console.log('❌ Erreur lors du nettoyage');
                }
            });
        } else {
            console.log('✅ Aucune bulle détectée');
        }
    });
}

// Lancer les tests
createTestUser(() => {
    testKeywordExtraction();
});