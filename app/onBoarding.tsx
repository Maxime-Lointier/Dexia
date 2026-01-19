import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Image, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; // Assurez-vous d'avoir installé expo-linear-gradient
import { useUser } from '../src/context/UserContext';
import { useTheme } from '../src/context/ThemeContext';
import { t, getCurrentLanguage, subscribeLanguageChange } from '../src/i18n';
import { Genre, getAllGenres, getTopRatedMovies, Movie } from '../src/models/movies';
import { Genre, getAllGenres, getTopRatedMovies, Movie, getMoviesByGenres } from '../src/models/movies'; 
import { updateUserPreferences, setOnboardingDone } from '../src/models/user';

const { width } = Dimensions.get('window');
const POSTER_WIDTH = (width - 48 - 20) / 3; // 3 colonnes avec padding
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w342';

// Styles des genres (inchangé)
const GENRE_STYLES: Record<number, { icon: string; color: string; }> = {
  28: { icon: 'bomb', color: '#B91C1C' }, // Action (Red-700)
  12: { icon: 'compass', color: '#15803D' }, // Aventure (Green-700)
  16: { icon: 'film', color: '#0F766E' }, // Animation (Teal-700)
  35: { icon: 'laugh', color: '#CA8A04' }, // Comédie (Yellow-600)
  80: { icon: 'mask', color: '#1F2937' }, // Crime (Gray-800)
  99: { icon: 'video', color: '#B45309' }, // Documentaire (Amber-700)
  18: { icon: 'theater-masks', color: '#1D4ED8' }, // Drame (Blue-700)
  10751: { icon: 'users', color: '#EC4899' }, // Famille (Pink-500)
  14: { icon: 'hat-wizard', color: '#4338CA' }, // Fantastique (Indigo-700)
  36: { icon: 'landmark', color: '#57534E' }, // Histoire (Stone-600)
  27: { icon: 'ghost', color: '#C2410C' }, // Horreur (Orange-700)
  10402: { icon: 'music', color: '#9333EA' }, // Musique (Purple-600)
  9648: { icon: 'search', color: '#0E7490' }, // Mystère (Cyan-700)
  10749: { icon: 'heart', color: '#BE185D' }, // Romance (Pink-700)
  878: { icon: 'rocket', color: '#7E22CE' }, // Sci-Fi (Purple-700)
  53: { icon: 'user-secret', color: '#111827' }, // Thriller (Gray-900)
  10752: { icon: 'fighter-jet', color: '#14532D' }, // Guerre (Green-900)
  37: { icon: 'horse', color: '#854D0E' }, // Western (Yellow-800)
};

const DEFAULT_STYLE = { icon: 'film', color: '#4B5563' };

const Onboarding = () => {
  // --- STATE ---
  const [step, setStep] = useState(1); // Étape 1: Genres, Étape 2: Films
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sélections
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);

  const { isDark, colors } = useTheme();
  const { currentUser, refreshUsers } = useUser();
  const [locale, setLocale] = useState(getCurrentLanguage());
  
  // Scroll Ref pour remonter en haut lors du changement d'étape
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadGenres();
    const unsubscribe = subscribeLanguageChange((newLang) => setLocale(newLang));
    return () => unsubscribe();
  }, []);

  // --- LOGIC ---

  const loadGenres = async () => {
    try {
      setLoading(true);
      const genresData = await getAllGenres();
      setGenres(genresData);
    } catch (error) {
      console.error("Erreur chargement genres:", error);
    } finally {
      setLoading(false);
    }
  };

  // Charge les films en fonction des genres sélectionnés (Étape 2)
  const loadRecommendedMovies = async () => {
    try {
      setLoading(true);
      // NOTE: Ici, idéalement, vous devriez appeler une API "discover" filtrée par les genres choisis.
      // Pour l'exemple, on prend les Top Rated, mais imaginez: `getMoviesByGenres(selectedGenres)`
      const moviesData = await getTopRatedMovies(30); 
      
      // Petit filtrage côté client pour simuler la pertinence (si l'API ne le fait pas)
      // On priorise les films qui contiennent au moins un des genres sélectionnés
      const sortedMovies = moviesData.sort((a, b) => {
        const aMatch = a.genre_ids.some(id => selectedGenres.includes(id));
        const bMatch = b.genre_ids.some(id => selectedGenres.includes(id));
        return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
      });

      setMovies(sortedMovies);
    } catch (error) {
      console.error("Erreur chargement films:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
      loadRecommendedMovies();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      if (!currentUser) return;
      setLoading(true);

      // On sauvegarde les genres ET on pourrait sauvegarder les IDs de films aimés
      // pour un algorithme de recommandation futur.
      await updateUserPreferences(currentUser.id, {
        genres: selectedGenres,
        keywords: [], // À remplir plus tard via analyse des films
        actors: []    // À remplir plus tard
      });
      
      // Vous pourriez ajouter une fonction pour sauvegarder les films "liked" :
      // await saveUserLikedMovies(currentUser.id, selectedMovies);

      await setOnboardingDone(currentUser.id, true);
      await refreshUsers();
      router.replace('/homeScreen');
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const toggleGenre = (id: number) => {
    if (selectedGenres.includes(id)) {
      setSelectedGenres(selectedGenres.filter(item => item !== id));
    } else {
      setSelectedGenres([...selectedGenres, id]);
    }
  };

  const toggleMovie = (id: number) => {
    if (selectedMovies.includes(id)) {
      setSelectedMovies(selectedMovies.filter(item => item !== id));
    } else {
      setSelectedMovies([...selectedMovies, id]);
    }
  };

  // --- RENDERERS ---

  const renderStep1Genres = () => (
    <View className="flex-row flex-wrap justify-between">
      {genres.map((genre) => {
        const isSelected = selectedGenres.includes(genre.id);
        const style = GENRE_STYLES[genre.id] || DEFAULT_STYLE;

        return (
          <TouchableOpacity
            key={genre.id}
            onPress={() => toggleGenre(genre.id)}
            activeOpacity={0.8}
            className="w-[48%] h-28 mb-3 rounded-2xl overflow-hidden relative"
            style={{ backgroundColor: style.color }}
          >
            {/* Overlay sélection */}
            {isSelected && <View className="absolute inset-0 bg-black/50 z-10" />}
            
            <View className="flex-1 p-4 justify-between z-0">
              <Icon name={style.icon} size={24} color="white" style={{ opacity: 0.9 }} />
              <Text className="text-white font-bold text-lg shadow-sm">
                {t(`onboarding.genres.${genre.id}`) || genre.name}
              </Text>
            </View>

            {/* Checkmark */}
            {isSelected && (
              <View className="absolute top-1/2 left-1/2 -ml-4 -mt-4 w-8 h-8 bg-white rounded-full items-center justify-center z-20 shadow-lg">
                <Icon name="check" size={16} color={style.color} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStep2Movies = () => (
    <View className="flex-row flex-wrap justify-between">
       <Text className="w-full text-base mb-4" style={{ color: colors.textSecondary }}>
          {t('onboarding.movies_subtitle')} {/* "Sélectionnez les films que vous avez aimés" */}
       </Text>
      {movies.map((movie) => {
        const isSelected = selectedMovies.includes(movie.id);

        return (
          <TouchableOpacity
            key={movie.id}
            onPress={() => toggleMovie(movie.id)}
            activeOpacity={0.7}
            style={{ width: POSTER_WIDTH }}
            className="mb-4 relative"
          >
            <View className={`rounded-xl overflow-hidden aspect-[2/3] ${isSelected ? 'ring-4 ring-primary' : ''}`}>
              <Image 
                source={{ uri: `${TMDB_IMAGE_URL}${movie.poster_path}` }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {isSelected && (
                <View className="absolute inset-0 bg-primary/40 items-center justify-center">
                  <Icon name="heart" solid size={32} color="white" />
                </View>
              )}
            </View>
            <Text 
              numberOfLines={1} 
              className="mt-2 text-xs font-medium text-center" 
              style={{ color: isSelected ? colors.primary : colors.text }}
            >
              {movie.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Conditions de validation
  const isStep1Valid = selectedGenres.length >= 3;
  const isStep2Valid = selectedMovies.length >= 3; // Forcer l'utilisateur à en choisir pour calibrer l'algo
  const canContinue = step === 1 ? isStep1Valid : isStep2Valid;


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* HEADER & PROGRESS */}
      <View className="px-6 pt-2 pb-2">
        {/* Barre de progression simple */}
        <View className="flex-row h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
          <View 
            className="bg-primary h-full rounded-full transition-all duration-500" 
            style={{ width: step === 1 ? '50%' : '100%' }} 
          />
        </View>

        <View className="items-center mb-2">
          <Text className="text-3xl font-bold mb-2 text-center font-hanken" style={{ color: colors.text }}>
            {step === 1 ? t('onboarding.title_step1') : t('onboarding.title_step2')}
          </Text>
          <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
            {step === 1 
              ? `${selectedGenres.length}/3 ${t('onboarding.min_selection')}` 
              : `${selectedMovies.length}/3 ${t('onboarding.min_movies')}`
            }
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 font-medium" style={{ color: colors.textSecondary }}>
            {step === 1 ? t('onboarding.loading_genres') : t('onboarding.calibrating')}
          </Text>
        </View>
      ) : (
        <ScrollView 
          ref={scrollRef}
          className="px-6 flex-1" 
          contentContainerStyle={{ paddingBottom: 140 }} 
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? renderStep1Genres() : renderStep2Movies()}
        </ScrollView>
      )}

      {/* FOOTER */}
      <View className="absolute bottom-0 left-0 right-0 p-6">
          {/* Dégradé pour fondre le contenu sous le bouton */}
          <LinearGradient
            colors={isDark ? ['transparent', 'rgba(15,15,30,0.95)', '#0F0F1E'] : ['transparent', 'rgba(255,255,255,0.9)', '#FFFFFF']}
            className="absolute inset-0 -top-12 h-[180%]"
            pointerEvents="none"
          />
          
        <View className="flex-row items-center justify-between">
           {/* Bouton Retour (Visible seulement étape 2) */}
           {step === 2 && (
              <TouchableOpacity 
                onPress={() => setStep(1)}
                className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center mr-4"
              >
                <Icon name="arrow-left" size={18} color={colors.text} />
              </TouchableOpacity>
           )}

            <TouchableOpacity
              disabled={!canContinue}
              onPress={handleNextStep}
              className={`flex-1 py-4 rounded-2xl items-center justify-center shadow-lg flex-row space-x-2 
                ${canContinue ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-800'}`}
              style={{ elevation: canContinue ? 4 : 0 }}
            >
              <Text className={`font-bold text-lg ${canContinue ? 'text-white' : 'text-gray-500'}`}>
                {step === 1 ? t('onboarding.continue') : t('onboarding.finish')}
              </Text>
              {canContinue && <Icon name={step === 1 ? "arrow-right" : "check"} size={16} color="white" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;
