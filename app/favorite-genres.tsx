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
import { getUserPreferences, updateUserPreferences, UserPreferences } from '../src/models/user';

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

const FavoriteGenres = () => {
  const { colors, isDark } = useTheme();
  const { currentUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullPreferences, setFullPreferences] = useState<UserPreferences | null>(null);
  
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (currentUser) {
      const prefs = await getUserPreferences(currentUser.id);
      setFullPreferences(prefs);
      setSelectedGenres(prefs.genres || []);
      setLoading(false);
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

      const success = await updateUserPreferences(currentUser.id, updatedPreferences);
      
      if (success) {
        router.back();
      } else {
        Alert.alert("Erreur", "Impossible de sauvegarder les préférences.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Genres préférés</Text>
        
        {}
        <TouchableOpacity 
            onPress={handleSave} 
            disabled={saving || loading}
            style={{ padding: 8 }}
        >
            {saving ? (
                <ActivityIndicator size="small" color="#8A3AFF" />
            ) : (
                <Text style={{ color: '#8A3AFF', fontWeight: 'bold', fontSize: 16 }}>OK</Text>
            )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#8A3AFF" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            
            <Text style={{ color: colors.textSecondary, marginBottom: 20, fontSize: 15, lineHeight: 22 }}>
                Sélectionnez les catégories qui vous intéressent le plus. Cela nous aidera à améliorer vos recommandations.
            </Text>

            <View style={styles.grid}>
                {ALL_GENRES.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.id);
                    return (
                        <TouchableOpacity
                            key={genre.id}
                            style={[
                                styles.chip,
                                { 
                                    backgroundColor: isSelected ? '#8A3AFF' : colors.card,
                                    borderColor: isSelected ? '#8A3AFF' : colors.border,
                                }
                            ]}
                            onPress={() => toggleGenre(genre.id)}
                            activeOpacity={0.7}
                        >
                            {}
                            <Icon 
                                name={genre.icon} 
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'flex-start'
  },
  chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 24,
      borderWidth: 1,
      marginBottom: 4,
  }
});

export default FavoriteGenres;