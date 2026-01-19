import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { t } from '../src/i18n'; 
import { 
    getUserPreferences, 
    updateUserPreferences, 
    UserPreferences,
    getDatabase 
} from '../src/models/user';

// On garde les id et icones ici, mais les noms sont générés par i18n
const ALL_GENRES = [
  { id: 28, icon: "fire" },
  { id: 12, icon: "compass-outline" },
  { id: 16, icon: "creation" },
  { id: 35, icon: "emoticon-happy-outline" },
  { id: 80, icon: "pistol" },
  { id: 99, icon: "file-document-outline" },
  { id: 18, icon: "drama-masks" },
  { id: 10751, icon: "home-heart" },
  { id: 14, icon: "unicorn-variant" },
  { id: 36, icon: "book-open-page-variant" },
  { id: 27, icon: "ghost" },
  { id: 10402, icon: "music" },
  { id: 9648, icon: "magnify" },
  { id: 10749, icon: "heart" },
  { id: 878, icon: "robot" },
  { id: 10770, icon: "television-classic" },
  { id: 53, icon: "eye-outline" },
  { id: 10752, icon: "tank" },
  { id: 37, icon: "horseshoe" },
];

const THRESHOLD_AUTO_SELECT = 8;

const FavoriteGenres = () => {
  const { colors, isDark } = useTheme();
  const { currentUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullPreferences, setFullPreferences] = useState<UserPreferences | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
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

      {/* Header*/}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('favoriteGenres.title')}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || loading} style={{ padding: 8 }}>
            {saving ? (
                <ActivityIndicator size="small" color="#8A3AFF" />
            ) : (
                <Text style={{ color: '#8A3AFF', fontWeight: 'bold', fontSize: 16 }}>
                    {t('favoriteGenres.saveOk')}
                </Text>
            )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8A3AFF" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            
            {/* Info Box avec Traduction */}
            <View style={[styles.infoBox, { backgroundColor: 'rgba(138, 58, 255, 0.1)', borderColor: 'rgba(138, 58, 255, 0.3)' }]}>
                <Icon name="creation" size={24} color="#8A3AFF" style={{marginRight: 12}} />
                <Text style={{color: colors.text, flex: 1, fontSize: 13, lineHeight: 18}}>
                    {t('favoriteGenres.autoInfo')}
                </Text>
            </View>

            <View style={styles.grid}>
                {ALL_GENRES
                  .sort((a, b) => {
                      const selectedA = selectedGenres.includes(a.id) ? 1 : 0;
                      const selectedB = selectedGenres.includes(b.id) ? 1 : 0;
                      if (selectedA !== selectedB) return selectedB - selectedA;
                      return t(`onboarding.genres.${a.id}`).localeCompare(t(`onboarding.genres.${b.id}`));
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
                                {/* traduction basés sur l id*/}
                                {t(`onboarding.genres.${genre.id}`)}
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