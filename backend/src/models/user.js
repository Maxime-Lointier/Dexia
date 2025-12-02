const db = require('./db');

module.exports = {
getUserPreferences,
isOnboardingDone,
setOnboardingDone,
addDynamicKeywords,
detectFilterBubble,
cleanupKeywords,
exportUserKeywordsToArray,
extractKeywordsFromMovie
}

function getUserPreferences(userId, callback) {
    const sql = 'SELECT preferences, keywords FROM user_profile WHERE id = ?';
    db.get(sql, [userId], (err, row) => {
        if (err || !row) {
            console.error(err ? err.message : 'User not found');
            return callback({ genres: [], keywords: [] });
        }
        const genres = JSON.parse(row.preferences || '[]');
        
        // Utiliser la nouvelle fonction d'export pour les mots-clés
        exportUserKeywordsToArray(userId, (keywordsArray) => {
            callback({ 
                genres, 
                keywords: keywordsArray,
                _rawKeywords: JSON.parse(row.keywords || '[]') // Garde l'accès aux données brutes
            });
        });
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

// Mots vides à filtrer lors de l'extraction
const STOP_WORDS = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'dans', 'sur', 
    'avec', 'sans', 'pour', 'par', 'vers', 'chez', 'très', 'plus', 'moins',
    'tout', 'tous', 'toute', 'toutes', 'ce', 'cet', 'cette', 'ces',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'with', 'for', 'by',
    // Mots génériques à éviter
    'est', 'sont', 'ont', 'ses', 'leur', 'leurs', 'que', 'qui', 'dont', 'où',
    'comme', 'alors', 'aussi', 'bien', 'encore', 'déjà', 'depuis', 'pendant',
    'ann', 'ans', 'année', 'années', 'fois', 'jour', 'jours', 'temps', 'moment',
    'chose', 'choses', 'histoire', 'histoires', 'place', 'fin',
    'part', 'partie', 'parties', 'tre', 'avoir', 'faire', 'dire', 'voir',
    'peut', 'doit', 'veut', 'vont', 'font', 'tous', 'toute', 'après', 'avant',
    'mais', 'donc', 'ainsi', 'entre', 'contre', 'sous', 'avec', 'sans',
    // Fragments courants à éviter
    'premi', 'deuxi', 'troisi', 'alli', 'curit', 'peupl', 'journ', 'ment'
]);

// Mappage genre -> mots-clés associés
const GENRE_KEYWORDS_MAP = {
    'Action': ['combat', 'bataille', 'guerre', 'explosion', 'poursuite', 'héros', 'super', 'martial'],
    'Science Fiction': ['futur', 'espace', 'robot', 'alien', 'technologie', 'vaisseau', 'planète', 'dystopie'],
    'Horror': ['peur', 'mort', 'sang', 'monstre', 'terreur', 'surnaturel', 'démoniaque', 'survie'],
    'Romance': ['amour', 'cœur', 'passion', 'relation', 'mariage', 'couple', 'sentiment', 'romantique'],
    'Comedy': ['drôle', 'humour', 'rire', 'comédie', 'amusant', 'blague', 'satirique', 'comique'],
    'Drama': ['famille', 'vie', 'émotion', 'personnel', 'social', 'psychologique', 'intime', 'profond'],
    'Thriller': ['suspense', 'mystère', 'enquête', 'danger', 'tension', 'crime', 'investigation', 'secret'],
    'Fantasy': ['magie', 'dragon', 'épée', 'royaume', 'quête', 'mythique', 'légende', 'enchantement'],
    'Adventure': ['aventure', 'voyage', 'exploration', 'découverte', 'périple', 'expédition', 'quête', 'évasion']
};

/**
 * Extrait des mots-clés pertinents d'un film
 */
function extractKeywordsFromMovie(movie, genres, callback) {
    try {
        const keywords = new Set();
        
        // 1. Extraire du titre (priorité très haute)
        if (movie.title) {
            const titleWords = extractWordsFromText(movie.title)
                .filter(word => word.length >= 3); // Moins strict pour garder plus de mots du titre
            
            // Prendre TOUS les mots significatifs du titre
            titleWords.forEach(word => {
                if (!STOP_WORDS.has(word)) {
                    keywords.add(word);
                }
            });
        }
        
        // 2. Extraire de l'overview (plus généreux)
        if (movie.overview) {
            const overviewWords = extractWordsFromText(movie.overview)
                .filter(word => word.length >= 4) // Moins strict pour l'overview
                .filter(word => {
                    // Privilégier les noms propres, mots significatifs et concepts clés EN FRANÇAIS
                    return word[0] === word[0].toUpperCase() || 
                           ['robot', 'alien', 'espace', 'bataille', 'magie', 'dragon', 'héros', 'méchant', 'guerre', 'combat', 'quête', 'voyage', 'monde', 'royaume', 'pouvoir', 'secret', 'famille', 'amour', 'mort', 'vengeance', 'justice', 'liberté', 'espoir', 'danger', 'mystère', 'aventure', 'mission', 'destin'].some(term => word.includes(term)) ||
                           word.length >= 6; // Garder les mots longs qui sont souvent significatifs
                });
            
            overviewWords.slice(0, 5).forEach(word => keywords.add(word)); // Passer de 3 à 5
        }
        
        // 3. Ajouter mots-clés liés aux genres (plus généreux)
        if (genres && genres.length > 0) {
            genres.forEach(genre => {
                const relatedKeywords = GENRE_KEYWORDS_MAP[genre.name] || [];
                // Prendre 2 mots-clés par genre pour plus de contexte
                const selectedKeywords = relatedKeywords
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 2);
                selectedKeywords.forEach(keyword => keywords.add(keyword));
            });
        }
        
        const extractedKeywords = Array.from(keywords)
            .filter(word => word.length >= 3) // Moins strict pour la vérification finale
            .slice(0, 10); // Augmenter à 10 mots-clés pour plus de contexte
            
        callback(extractedKeywords);
        
    } catch (error) {
        console.error('Erreur extraction mots-clés:', error);
        callback([]);
    }
}

/**
 * Extrait et filtre les mots d'un texte
 */
function extractWordsFromText(text) {
    if (!text) return [];
    
    return text
        .toLowerCase()
        .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, ' ') // Préserve les accents français
        .split(/\s+/) // Divise par les espaces
        .filter(word => word.length >= 4) // Minimum 4 caractères (au lieu de 3)
        .filter(word => !STOP_WORDS.has(word)) // Exclut les mots vides
        .filter(word => !/^\d+$/.test(word)) // Exclut les nombres purs
        .filter(word => !word.includes('`')) // Évite les fragments avec backticks
        .filter(word => !/^(.*ing|.*ed|.*er|.*est)$/.test(word) || word.length > 6) // Évite les terminaisons courtes
        .filter(word => word.match(/^[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]+$/)) // Seulement lettres + accents
        .slice(0, 8); // Limite réduite pour plus de qualité
}

/**
 * Ajoute des mots-clés dynamiques avec système FIFO (max 20)
 */
function addDynamicKeywords(userId, newKeywords, callback) {
    if (!newKeywords || newKeywords.length === 0) {
        return callback(true);
    }
    
    getUserPreferences(userId, (currentPrefs) => {
        try {
            let keywordData;
            
            // Initialiser la structure si nécessaire
            if (!currentPrefs.keywords || Array.isArray(currentPrefs.keywords)) {
                // Migrer l'ancien format vers le nouveau
                keywordData = {
                    static: Array.isArray(currentPrefs.keywords) ? currentPrefs.keywords : [],
                    dynamic: []
                };
            } else {
                keywordData = currentPrefs.keywords;
            }
            
            const now = new Date().toISOString();
            
            // Traiter chaque nouveau mot-clé
            newKeywords.forEach(keyword => {
                const existing = keywordData.dynamic.find(k => k.keyword === keyword);
                
                if (existing) {
                    // Renforcer le mot-clé existant
                    existing.weight = Math.min(existing.weight * 1.2, 3.0);
                    existing.lastUsed = now;
                } else {
                    // Ajouter nouveau mot-clé
                    keywordData.dynamic.push({
                        keyword: keyword,
                        weight: 1.0,
                        added: now,
                        lastUsed: now
                    });
                }
            });
            
            // Appliquer la limite FIFO (max 20 mots-clés dynamiques)
            if (keywordData.dynamic.length > 100) {
                // Trier par poids (asc) puis par date (asc) et supprimer les plus faibles/anciens
                keywordData.dynamic.sort((a, b) => {
                    if (a.weight !== b.weight) return a.weight - b.weight;
                    return new Date(a.added) - new Date(b.added);
                });
                keywordData.dynamic = keywordData.dynamic.slice(keywordData.dynamic.length - 100);
            }
            
            // Sauvegarder
            const sql = 'UPDATE user_profile SET keywords = ? WHERE id = ?';
            db.run(sql, [JSON.stringify(keywordData), userId], function(err) {
                if (err) {
                    console.error('Erreur sauvegarde mots-clés:', err.message);
                    return callback(false);
                }
                callback(true);
            });
            
        } catch (error) {
            console.error('Erreur traitement mots-clés:', error);
            callback(false);
        }
    });
}

/**
 * Détecte si l'utilisateur est dans une bulle de filtres
 */
function detectFilterBubble(userId, recentInteractions, callback) {
    try {
        if (!recentInteractions || recentInteractions.length < 10) {
            return callback({ hasBubble: false, bubbleType: 'none', confidence: 0 });
        }
        
        // 1. Détection d'over-disliking (70%+ de dislikes)
        const dislikes = recentInteractions.filter(i => i.action === 'dislike').length;
        const dislikeRate = dislikes / recentInteractions.length;
        
        if (dislikeRate > 0.7) {
            return callback({ 
                hasBubble: true, 
                bubbleType: 'over_disliking', 
                confidence: dislikeRate,
                recommendation: 'reduce_specificity'
            });
        }
        
        // 2. Détection de saturation de mots-clés (trop spécifiques)
        getUserPreferences(userId, (prefs) => {
            if (prefs.keywords && prefs.keywords.dynamic) {
                const highWeightKeywords = prefs.keywords.dynamic.filter(k => k.weight > 2.0).length;
                const totalKeywords = prefs.keywords.dynamic.length;
                
                if (totalKeywords > 15 && highWeightKeywords / totalKeywords > 0.6) {
                    return callback({
                        hasBubble: true,
                        bubbleType: 'keyword_saturation',
                        confidence: highWeightKeywords / totalKeywords,
                        recommendation: 'diversify_keywords'
                    });
                }
            }
            
            callback({ hasBubble: false, bubbleType: 'none', confidence: 0 });
        });
        
    } catch (error) {
        console.error('Erreur détection bulle:', error);
        callback({ hasBubble: false, bubbleType: 'none', confidence: 0 });
    }
}

/**
 * Nettoie les mots-clés selon la stratégie anti-bulle
 */
function cleanupKeywords(userId, bubbleType, callback) {
    getUserPreferences(userId, (currentPrefs) => {
        try {
            let keywordData = currentPrefs.keywords;
            
            if (!keywordData || !keywordData.dynamic) {
                return callback(true);
            }
            
            switch (bubbleType) {
                case 'over_disliking':
                    // Réduire le poids des mots-clés les plus spécifiques
                    keywordData.dynamic.forEach(k => {
                        if (k.weight > 1.5) {
                            k.weight = k.weight * 0.7;
                        }
                    });
                    // Supprimer les 3 mots-clés les plus faibles
                    keywordData.dynamic.sort((a, b) => a.weight - b.weight);
                    keywordData.dynamic = keywordData.dynamic.slice(3);
                    break;
                    
                case 'keyword_saturation':
                    // Supprimer 30% des mots-clés les plus anciens
                    const toRemove = Math.floor(keywordData.dynamic.length * 0.3);
                    keywordData.dynamic.sort((a, b) => new Date(a.added) - new Date(b.added));
                    keywordData.dynamic = keywordData.dynamic.slice(toRemove);
                    break;
            }
            
            // Sauvegarder
            const sql = 'UPDATE user_profile SET keywords = ? WHERE id = ?';
            db.run(sql, [JSON.stringify(keywordData), userId], function(err) {
                if (err) {
                    console.error('Erreur nettoyage mots-clés:', err.message);
                    return callback(false);
                }
                callback(true);
            });
            
        } catch (error) {
            console.error('Erreur nettoyage:', error);
            callback(false);
        }
    });
}

/**
 * Exporte tous les mots-clés utilisateur sous forme de tableau simple
 * pour compatibilité avec le système existant
 */
function exportUserKeywordsToArray(userId, callback) {
    getUserPreferences(userId, (prefs) => {
        try {
            let allKeywords = [];
            
            if (!prefs.keywords) {
                return callback([]);
            }
            
            // Format moderne (objet avec static/dynamic)
            if (typeof prefs.keywords === 'object' && !Array.isArray(prefs.keywords)) {
                // Mots-clés statiques (onboarding)
                if (prefs.keywords.static) {
                    allKeywords.push(...prefs.keywords.static);
                }
                
                // Mots-clés dynamiques (triés par poids décroissant)
                if (prefs.keywords.dynamic) {
                    const sortedDynamic = prefs.keywords.dynamic
                        .filter(k => k.weight > 0.3) // Seuil minimum
                        .sort((a, b) => b.weight - a.weight)
                        .map(k => k.keyword);
                    
                    allKeywords.push(...sortedDynamic);
                }
            } 
            // Format ancien (tableau simple)
            else if (Array.isArray(prefs.keywords)) {
                allKeywords = prefs.keywords;
            }
            
            // Supprimer les doublons et limiter à 15 mots-clés les plus pertinents
            const uniqueKeywords = [...new Set(allKeywords)].slice(0, 15);
            callback(uniqueKeywords);
            
        } catch (error) {
            console.error('Erreur export mots-clés:', error);
            callback([]);
        }
    });
}



