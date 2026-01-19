import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { 
    getUserPreferences, 
    updateUserPreferences, 
    UserPreferences,
    getDatabase 
} from '../src/models/user';

const ALL_GENRES = [
  { id: 28, name: "Action", icon: "fire" },
  { id: 12, name: "Aventure", icon: "compass-outline" },
  { id: 16, name: "Animation", icon: "creation" },
  { id: 35, name: "Comédie", icon: "emoticon-happy-outline" },
  { id: 80, name: "Crime", icon: "pistol" },
  { id: 99, name: "Documentaire", icon: "file-document-outline" },
  { id: 18, name: "Drame", icon: "drama-masks" },
  { id: 10751, name: "Famille", icon: "home-heart" },
  { id: 14, name: "Fantastique", icon: "unicorn-variant" },
  { id: 36, name: "Histoire", icon: "book-open-page-variant" },
  { id: 27, name: "Horreur", icon: "ghost" },
  { id: 10402, name: "Musique", icon: "music" },
  { id: 9648, name: "Mystère", icon: "magnify" },
  { id: 10749, name: "Romance", icon: "heart" },
  { id: 878, name: "Science-Fiction", icon: "robot" },
  { id: 10770, name: "Téléfilm", icon: "television-classic" },
  { id: 53, name: "Thriller", icon: "eye-outline" },
  { id: 10752, name: "Guerre", icon: "tank" },
  { id: 37, name: "Western", icon: "horseshoe" },
];

const THRESHOLD_AUTO_SELECT = 8;

const FavoriteGenres = () => {
  const { colors, isDark } = useTheme();
  const { currentUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullPreferences, setFullPreferences] = useState<UserPreferences | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  
  // Pour stocker le classement (ID -> Score)
  const [genreScores, setGenreScores] = useState<{[key: number]: number}>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (currentUser) {
      try {

        const db = await getDatabase();
        
        const row = await db.getFirstAsync<{ preferences: string | null, genre_weights: string | null }>(
            'SELECT preferences, genre_weights FROM user_profile WHERE id = ?', [currentUser.id]
        );

        let manualGenres: number[] = [];
        let weights: {[key: number]: number} = {};

        if (row) {
            if (row.preferences) manualGenres = JSON.parse(row.preferences);
            if (row.genre_weights) weights = JSON.parse(row.genre_weights);
        }
        
        setGenreScores(weights);

        const autoAddedGenres = Object.keys(weights)
            .map(id => parseInt(id))
            .filter(id => weights[id] >= THRESHOLD_AUTO_SELECT);

        const mergedSelection = [...new Set([...manualGenres, ...autoAddedGenres])];

        const prefsObj = await getUserPreferences(currentUser.id);
        setFullPreferences(prefsObj);
        
        setSelectedGenres(mergedSelection);
        setLoading(false);

      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  const handleSave = async () => {
    if (!currentUser || !fullPreferences) return;

    setSaving(true);
    try {
      const updatedPreferences: UserPreferences = {
        ...fullPreferences,
        genres: selectedGenres
      };
      await updateUserPreferences(currentUser.id, updatedPreferences);
      router.back();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getRank = (genreId: number) => {
    const score = genreScores[genreId] || 0;
    
    if (score < THRESHOLD_AUTO_SELECT) return null;

    const sortedIds = Object.keys(genreScores)
        .map(id => parseInt(id))
        .filter(id => (genreScores[id] || 0) >= THRESHOLD_AUTO_SELECT)
        .sort((a, b) => (genreScores[b] || 0) - (genreScores[a] || 0));
    
    const index = sortedIds.indexOf(genreId);
    return index !== -1 ? index + 1 : null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Vos Genres</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || loading} style={{ padding: 8 }}>
            {saving ? <ActivityIndicator size="small" color="#8A3AFF" /> : <Text style={{ color: '#8A3AFF', fontWeight: 'bold', fontSize: 16 }}>OK</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8A3AFF" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            
            <View style={[styles.infoBox, { backgroundColor: 'rgba(138, 58, 255, 0.1)', borderColor: 'rgba(138, 58, 255, 0.3)' }]}>
                <Icon name="creation" size={24} color="#8A3AFF" style={{marginRight: 12}} />
                <Text style={{color: colors.text, flex: 1, fontSize: 13, lineHeight: 18}}>
                    Les genres que vous likez souvent (+5 fois) sont cochés automatiquement.
                </Text>
            </View>

            <View style={styles.grid}>
                {ALL_GENRES
                  .sort((a, b) => {
                      const selectedA = selectedGenres.includes(a.id) ? 1 : 0;
                      const selectedB = selectedGenres.includes(b.id) ? 1 : 0;
                      if (selectedA !== selectedB) return selectedB - selectedA;
                      return a.name.localeCompare(b.name);
                  })
                  .map((genre) => {
                    const isSelected = selectedGenres.includes(genre.id);
                    const rank = getRank(genre.id);
                    const isTop = rank !== null && rank <= 3; 

                    return (
                        <TouchableOpacity
                            key={genre.id}
                            style={[
                                styles.chip,
                                { 
                                    backgroundColor: isSelected ? (isTop ? '#5b21b6' : '#8A3AFF') : colors.card,
                                    borderColor: isSelected ? (isTop ? '#F59E0B' : '#8A3AFF') : colors.border,
                                    borderWidth: isTop ? 1 : 1,
                                    elevation: isTop ? 4 : 0
                                }
                            ]}
                            onPress={() => toggleGenre(genre.id)}
                            activeOpacity={0.7}
                        >
                            {isTop && (
                                <View style={styles.rankBadge}>
                                    <Text style={{color:'#fff', fontSize: 10, fontWeight:'bold'}}>#{rank}</Text>
                                </View>
                            )}

                            <Icon 
                                name={isSelected ? "check" : genre.icon} 
                                size={18} 
                                color={isSelected ? '#fff' : colors.textSecondary} 
                                style={{ marginRight: 8 }}
                            />
                            <Text style={{ 
                                color: isSelected ? '#fff' : colors.text,
                                fontWeight: isSelected ? '600' : '400' 
                            }}>
                                {genre.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 20,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 24,
      borderWidth: 1,
      marginBottom: 6,
      position: 'relative', 
  },
  rankBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#F59E0B', 
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#fff',
      zIndex: 10
  }
});

export default FavoriteGenres;