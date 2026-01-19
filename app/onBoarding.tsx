import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '../src/context/UserContext';
import { useTheme } from '../src/context/ThemeContext';
import { t, getCurrentLanguage, subscribeLanguageChange } from '../src/i18n';
import { Genre, getAllGenres, getTopRatedMovies, Movie } from '../src/models/movies';
import { updateUserPreferences, setOnboardingDone } from '../src/models/user';

// Associe l'ID du genre à une couleur et une icône
const GENRE_STYLES: Record<number, { icon: string; color: string; iconColor: string }> = {
  28: { icon: 'bomb', color: 'bg-red-700', iconColor: 'text-red-700' }, // Action
  12: { icon: 'compass', color: 'bg-green-700', iconColor: 'text-green-700' }, // Aventure
  16: { icon: 'film', color: 'bg-teal-700', iconColor: 'text-teal-700' }, // Animation
  35: { icon: 'laugh', color: 'bg-yellow-600', iconColor: 'text-yellow-600' }, // Comédie
  80: { icon: 'mask', color: 'bg-gray-800', iconColor: 'text-gray-800' }, // Crime
  99: { icon: 'video', color: 'bg-amber-700', iconColor: 'text-amber-700' }, // Documentaire
  18: { icon: 'theater-masks', color: 'bg-blue-700', iconColor: 'text-blue-700' }, // Drame
  10751: { icon: 'users', color: 'bg-pink-500', iconColor: 'text-pink-500' }, // Famille
  14: { icon: 'hat-wizard', color: 'bg-indigo-700', iconColor: 'text-indigo-700' }, // Fantastique
  36: { icon: 'landmark', color: 'bg-stone-600', iconColor: 'text-stone-600' }, // Histoire
  27: { icon: 'ghost', color: 'bg-orange-700', iconColor: 'text-orange-700' }, // Horreur
  10402: { icon: 'music', color: 'bg-purple-600', iconColor: 'text-purple-600' }, // Musique
  9648: { icon: 'search', color: 'bg-cyan-700', iconColor: 'text-cyan-700' }, // Mystère
  10749: { icon: 'heart', color: 'bg-pink-700', iconColor: 'text-pink-700' }, // Romance
  878: { icon: 'rocket', color: 'bg-purple-700', iconColor: 'text-purple-700' }, // Sci-Fi
  53: { icon: 'user-secret', color: 'bg-gray-900', iconColor: 'text-gray-900' }, // Thriller
  10752: { icon: 'fighter-jet', color: 'bg-green-900', iconColor: 'text-green-900' }, // Guerre
  37: { icon: 'horse', color: 'bg-yellow-800', iconColor: 'text-yellow-800' }, // Western
};

//En cas de genres non trouvés, on utilise un style par défaut
const DEFAULT_STYLE = { icon: 'film', color: 'bg-gray-600', iconColor: 'text-gray-600' };

const Onboarding = () => {
  //States pour données
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [locale, setLocale] = useState(getCurrentLanguage());
  //States pour l'UI
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark, colors } = useTheme();
  const { currentUser, refreshUsers } = useUser();

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
    const unsubscribe = subscribeLanguageChange((newLang) => setLocale(newLang));
    return () => unsubscribe(); // Nettoyage quand on quitte la page
  }, []);

  // Fonction pour charger les données
  const loadData = async () => {
    try {
      setLoading(true);

      // Importe les genres
      const genresData = await getAllGenres();
      setGenres(genresData);
      console.log("genres loaded : ", genresData.length);

      // Importe les films
      const moviesData = await getTopRatedMovies(20);
      setMovies(moviesData);
      console.log("movies loaded : ", moviesData.length);

    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logique de sélection (Clic sur une case)
  const toggleGenre = (id: number) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter(item => item !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  // Bouton "Continuer" activé seulement si 3 genres sont choisis
  const isContinueEnabled = selectedGenres.length >= 3;


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0F0F1E" : "#FFFFFF"} />

      {/* HEADER */}
      <View className="px-6 pt-2 pb-4">
        <View className="items-center mb-4">
          {/* Titre traduit */}
          <Text className="text-3xl font-bold mb-3 text-center font-hanken" style={{ color: colors.text }}>
            {t('onboarding.title')}
          </Text>
          <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
            {t('onboarding.subtitle')} ({selectedGenres.length}/3)
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8A3AFF" />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>{t('onboarding.loading')}</Text>
        </View>
      ) : (
        <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-between">
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre.id);
              const style = GENRE_STYLES[genre.id] || DEFAULT_STYLE;

              return (
                <TouchableOpacity
                  key={genre.id}
                  onPress={() => toggleGenre(genre.id)}
                  activeOpacity={0.8}
                  className={`w-[48%] h-32 mb-3 rounded-2xl p-4 justify-between overflow-hidden relative ${style.color}`}
                >
                  {isSelected && <View className="absolute inset-0 bg-black/40 z-0" />}

                  <View className="z-10 relative">
                    <Icon name={style.icon} size={24} color="white" style={{ marginBottom: 8 }} />
                    {/* TRAd du genre: On utilise l'ID pour chercher le nom dans le dictionnaire */}
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 18 }}>
                      {t(`onboarding.genres.${genre.id}`)}
                    </Text>
                  </View>

                  {isSelected && (
                    <View className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full items-center justify-center z-20">
                      <Icon name="check" size={12} style={{ color: 'black' }} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* FOOTER */}
      <View
        className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5"
        style={{ backgroundColor: colors.background }} // Fallback simple opaque, ou on pourrait gérer l'alpha manuellement
      >
        <TouchableOpacity
          disabled={!isContinueEnabled}
          onPress={async () => {
            try {
              if (!currentUser) return;
              await updateUserPreferences(currentUser.id, {
                genres: selectedGenres,
                keywords: [],
                actors: []
              });
              await setOnboardingDone(currentUser.id, true); // true = done
              await refreshUsers(); // Update context with new onboarding status
              router.replace('/homeScreen');
            } catch (error) {
              console.error(error);
            }
          }}
          className={`w-full py-4 rounded-full items-center justify-center ${isContinueEnabled ? 'bg-primary' : 'bg-gray-700'}`}
        >
          <Text
            className="font-semibold text-lg"
            style={{ color: isContinueEnabled ? 'white' : colors.textSecondary }}
          >
            {t('onboarding.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;