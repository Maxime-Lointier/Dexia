import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback } from 'react';
import { Logo } from '../src/components/Logo';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { t } from '../src/i18n';

import { getPosterById } from '../src/utils/posterMap';
import { Movie, getMoviesByGenresAndKeywords, getMovieGenreById, getRandomMovies, getMovieGenreIdById, getMovieById } from '../src/models/movies';
import { getUserPreferences, CURRENT_USER_ID, setOnboardingDone } from '../src/models/user';
import { getUserSeenMovieIds, getWatchlistMovies, getWatchlistCount, getLikeCount, isInWatchlist, toggleWatchlist, cleanupInteractionsIfNeeded, toggleLike, hasUserInteractedWithMovie } from '../src/models/interaction';
import { getMovieCast, Cast } from '../src/models/cast';
import { getLikedMovies } from '../src/models/interaction';
import GenrePieChart from '../src/components/GenrePieChart';


function computeGenreDistribution(movies: any[]) {
  const genreCount: Record<string, number> = {};

  movies.forEach(movie => {
    movie.genres?.forEach((genre: any) => {
      genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
    });
  });

  return Object.entries(genreCount).map(([name, count]) => ({
    name,
    count,
  }));
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const INCEPTION_ID = 27205;
const INTERSTELLAR_ID = 157336;
const DARK_KNIGHT_ID = 155;

export default function MainPage() {
  const [recommendations, setRecommendations] = useState<(Movie & { genres: string[], matchPercentage: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedMovieGenres, setSelectedMovieGenres] = useState<string[]>([]);
  const [selectedMovieCast, setSelectedMovieCast] = useState<Cast[]>([]);
  const [selectedMovieMatch, setSelectedMovieMatch] = useState<number>(0);
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isSelectedMovieInWatchlist, setIsSelectedMovieInWatchlist] = useState(false);
  const [isSelectedMovieLiked, setIsSelectedMovieLiked] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [allLikedMovies, setAllLikedMovies] = useState<Movie[]>([]);
  const likesModalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const [allWatchlistMovies, setAllWatchlistMovies] = useState<Movie[]>([]);
  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const watchlistModalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const { isDark, colors } = useTheme();
  const { currentUser, resetApp } = useUser();
  const genreData = computeGenreDistribution(allLikedMovies);
  console.log(' genreData:', genreData); // temporaire pour test

  const calculateMatchPercentage = async (movie: Movie, preferences: { genres: number[], keywords: string[] }): Promise<number> => {
    if (preferences.genres.length === 0) {
      return 50;
    }

    const genreIds = await getMovieGenreIdById(movie.id);
    const matchingGenres = genreIds.filter(id => preferences.genres.includes(id));

    if (matchingGenres.length === 0) {
      return 20;
    }

    const genreMatchRatio = matchingGenres.length / Math.max(preferences.genres.length, genreIds.length);

    let keywordMatch = 0;
    if (preferences.keywords && preferences.keywords.length > 0 && movie.overview) {
      const overviewLower = movie.overview.toLowerCase();
      const titleLower = movie.title.toLowerCase();
      const matchingKeywords = preferences.keywords.filter(keyword =>
        overviewLower.includes(keyword.toLowerCase()) || titleLower.includes(keyword.toLowerCase())
      );
      keywordMatch = matchingKeywords.length / preferences.keywords.length;
    }

    const finalScore = (genreMatchRatio * 0.8) + (keywordMatch * 0.2);

    return Math.min(98, Math.max(20, Math.round(finalScore * 100)));
  };

  const loadWatchlist = async () => {
    try {
      console.log('📋 HomeScreen: Chargement watchlist...');
      if (!currentUser) return;
      const userId = currentUser.id;

      // Retry mécanisme pour éviter les erreurs de DB
      let retries = 3;
      while (retries > 0) {
        try {
          const movies = await getWatchlistMovies(userId);
          const count = await getWatchlistCount(userId);
          console.log(`📋 HomeScreen: ${movies.length} films, count=${count}`);
          setWatchlistMovies(movies.slice(0, 6)); // Limite à 6 pour l'affichage horizontal
          setWatchlistCount(count);
          break; // Succès, sortir de la boucle
        } catch (error: any) {
          retries--;
          if (retries > 0 && error.message?.includes('NullPointerException')) {
            console.log(`⚠️ Retry chargement watchlist (${3 - retries}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement watchlist:', error);
      setWatchlistMovies([]); // Valeurs par défaut en cas d'erreur
      setWatchlistCount(0);
    }
  };

  const loadStats = async () => {
    try {
      if (!currentUser) return;
      const userId = currentUser.id;

      // Retry mécanisme pour éviter les erreurs de DB
      let retries = 3;
      while (retries > 0) {
        try {
          const likes = await getLikeCount(userId);
          console.log(`❤️ HomeScreen: ${likes} films likés`);
          setLikeCount(likes);
          break; // Succès, sortir de la boucle
        } catch (error: any) {
          retries--;
          if (retries > 0 && error.message?.includes('NullPointerException')) {
            console.log(`⚠️ Retry chargement stats (${3 - retries}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            throw error; // Relancer l'erreur si plus de retries ou erreur différente
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      setLikeCount(0); // Valeur par défaut en cas d'erreur
    }
  };


  const loadLikedMovies = async () => {
    if (currentUser) {
      const movies = await getLikedMovies(currentUser.id);
      setAllLikedMovies(movies);
    }
  };


  const loadRecommendations = async () => {
    setLoading(true);
    try {
      if (!currentUser) return;
      const userId = currentUser.id;

      // Nettoyage automatique si nécessaire
      await cleanupInteractionsIfNeeded(userId);

      const preferences = await getUserPreferences(userId);
      const seenIds = await getUserSeenMovieIds(userId);

      // On récupère 10 films recommandés
      // Si pas de préférences, on prend des films aléatoires pour commencer
      let movies: Movie[] = [];

      if (preferences.genres && preferences.genres.length > 0) {
        movies = await getMoviesByGenresAndKeywords(
          preferences.genres,
          preferences.keywords,
          seenIds,
          10 // Limite à 10 films
        );
      }

      // Fallback si pas de films trouvés ou pas de préférences
      if (movies.length === 0) {
        movies = await getRandomMovies(10);
      }

      const moviesWithGenres = await Promise.all(movies.map(async (movie) => {
        const genres = await getMovieGenreById(movie.id);
        const match = await calculateMatchPercentage(movie, preferences);
        return { ...movie, genres: genres.map(g => g.name).slice(0, 2), matchPercentage: match };
      }));

      const sortedMovies = moviesWithGenres.sort((a, b) => b.matchPercentage - a.matchPercentage);

      setRecommendations(sortedMovies);

      // Charger également la watchlist et les statistiques (de manière indépendante)
      Promise.all([
        loadWatchlist().catch(err => console.warn('⚠️ Erreur watchlist non bloquante:', err)),
        loadStats().catch(err => console.warn('⚠️ Erreur stats non bloquante:', err))
      ]);
    } catch (error) {
      console.error("Erreur chargement recommandations home:", error);
      // Même en cas d'erreur, essayer de charger watchlist et stats
      Promise.all([
        loadWatchlist().catch(() => { }),
        loadStats().catch(() => { })
      ]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadRecommendations();
        // Recharger aussi la watchlist et les stats quand on revient sur cet écran
        loadWatchlist();
        loadStats();
        loadLikedMovies();
      }
    }, [currentUser])
  );

  const getPosterSource = (movie: Movie): any => {
    const poster = getPosterById(movie.id);
    if (poster) return poster;

    if (movie.poster_path) {
      const fileName = movie.poster_path.split('\\').pop() || movie.poster_path.split('/').pop();
      if (fileName) {
        const fileId = fileName.replace('.jpg', '');
        const numericId = parseInt(fileId, 10);
        if (!isNaN(numericId)) {
          const posterFromPath = getPosterById(numericId);
          if (posterFromPath) return posterFromPath;
        }
      }
    }
    return null;
  };

  const getPoster = (id: number) => getPosterById(id);

  const openInfoModal = async (movie: Movie & { genres?: string[], matchPercentage?: number }) => {
    setSelectedMovie(movie);
    setSelectedMovieMatch(movie.matchPercentage || 50);

    try {
      const genres = await getMovieGenreById(movie.id);
      setSelectedMovieGenres(genres.map(g => g.name));

      const cast = await getMovieCast(movie.id);
      setSelectedMovieCast(cast);

      if (currentUser) {
        const inWatchlist = await isInWatchlist(currentUser.id, movie.id);
        setIsSelectedMovieInWatchlist(inWatchlist);
        const isLiked = await hasUserInteractedWithMovie(currentUser.id, movie.id, 'like');
        setIsSelectedMovieLiked(isLiked);
      }
    } catch (error) {
      console.error('Erreur chargement détails film:', error);
      setSelectedMovieCast([]);
      setIsSelectedMovieInWatchlist(false);
      setIsSelectedMovieLiked(false);
    }

    setShowInfoModal(true);
    modalTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    });
  };

  const openInfoModalById = async (movieId: number) => {
    try {
      if (!currentUser) return;
      const movie = await getMovieById(movieId);
      if (movie) {
        const preferences = await getUserPreferences(currentUser.id);
        const genreIds = await getMovieGenreIdById(movieId);
        const match = await calculateMatchPercentage(movie, preferences);
        await openInfoModal({ ...movie, matchPercentage: match });
      }
    } catch (error) {
      console.error('Erreur chargement film par ID:', error);
    }
  };

  const closeInfoModal = () => {
    modalTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(setShowInfoModal)(false);
    });
  };

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: modalTranslateY.value }],
    };
  });

  const watchlistModalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: watchlistModalTranslateY.value }],
    };
  });

  const likesModalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: likesModalTranslateY.value }],
  }));


  const openWatchlistModal = async () => {
    try {
      if (!currentUser) return;
      const userId = currentUser.id;
      const movies = await getWatchlistMovies(userId);
      setAllWatchlistMovies(movies);
      setShowWatchlistModal(true);
      watchlistModalTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      });
    } catch (error) {
      console.error('Erreur ouverture modal watchlist:', error);
    }
  };

  const closeWatchlistModal = () => {
    watchlistModalTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(setShowWatchlistModal)(false);
    });
  };

  const openLikesModal = async () => {
    if (!currentUser) return;
    const movies = await getLikedMovies(currentUser.id);
    setAllLikedMovies(movies);
    setShowLikesModal(true);
    likesModalTranslateY.value = withSpring(0);
  };

  const closeLikesModal = () => {
    likesModalTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(setShowLikesModal)(false);
    });
  };


  const handleToggleWatchlist = async () => {
    if (!selectedMovie) return;

    try {
      if (selectedMovie && currentUser) {
        await toggleWatchlist(currentUser.id, selectedMovie.id);
        setIsSelectedMovieInWatchlist(!isSelectedMovieInWatchlist);
        // Recharger la watchlist et les stats pour mettre à jour l'affichage immédiatement
        await loadWatchlist();
        await loadStats();
      }
    } catch (error) {
      console.error('Erreur toggle watchlist:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!selectedMovie) return;

    try {
      if (selectedMovie && currentUser) {
        await toggleLike(currentUser.id, selectedMovie.id);
        setIsSelectedMovieLiked(!isSelectedMovieLiked);
        await loadStats(); // Recharger stats car le nombre de likes change
        await loadLikedMovies(); // Recharger la liste des films aimés
      }
    } catch (error) {
      console.error('Erreur toggle like:', error);
    }
  };

  const handleResetOnboarding = async () => {
    console.log("🔄 Reset complet de l'application demandé...");
    await resetApp();
    router.replace('/');
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.background} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Logo width={50} height={50} />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Dexia</Text>
              <Text style={{ color: '#FF4FFD', fontSize: 12, fontStyle: 'italic' }}>The Right Swipe</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ width: 40, height: 40, backgroundColor: colors.card, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <FontAwesome5 name="user" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* SECTION STATS */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Carte 1 : Films aimés */}
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center' }}
              activeOpacity={0.7}
              onPress={openLikesModal}
            >
              <View style={{ width: 40, height: 40, backgroundColor: 'rgba(138, 58, 255, 0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <FontAwesome name="heart" size={18} color="#8A3AFF" />
              </View>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>{likeCount}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, textTransform: 'uppercase', fontWeight: '500', marginTop: 4 }}>{t('home.stats.liked')}</Text>
            </TouchableOpacity>

            {/* Carte 2 : À voir */}
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center' }}
              activeOpacity={0.7}
              onPress={openWatchlistModal}
            >
              <View style={{ width: 40, height: 40, backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <FontAwesome name="bookmark" size={18} color="#F59E0B" />
              </View>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>{watchlistCount}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 10, textTransform: 'uppercase', fontWeight: '500', marginTop: 4 }}>{t('home.stats.watchlist')}</Text>
            </TouchableOpacity>


          </View>
        </View>

        {/* SECTION À VOIR PLUS TARD (Scroll Horizontal) */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{t('home.watchlist.title')}</Text>
            <TouchableOpacity onPress={openWatchlistModal}>
              <Text style={{ color: '#8A3AFF', fontSize: 12, fontWeight: 'bold' }}>{t('home.watchlist.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {watchlistMovies.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
              {watchlistMovies.map((movie) => (
                <TouchableOpacity key={movie.id} className="w-32" onPress={() => openInfoModal(movie)}>
                  <View className="relative h-48 rounded-xl overflow-hidden mb-2">
                    {getPosterSource(movie) ? (
                      <Image
                        source={getPosterSource(movie)}
                        className="w-full h-full" resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full bg-gray-800 items-center justify-center">
                        <FontAwesome5 name="image" size={24} color={colors.textSecondary} />
                      </View>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} className="absolute inset-0" />
                    <View className="absolute top-2 right-2 w-7 h-7 bg-[#F59E0B] rounded-full items-center justify-center">
                      <FontAwesome name="bookmark" size={12} color="white" />
                    </View>
                    <View className="absolute bottom-2 left-2 flex-row items-center gap-1">
                      <FontAwesome name="star" size={10} color="#FACC15" />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>{movie.vote_average.toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }} numberOfLines={1}>{movie.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View className="items-center py-8 px-6">
              <FontAwesome name="bookmark-o" size={48} color={colors.textSecondary} />
              <Text className="text-textSecondary text-lg font-bold mt-4 mb-2 text-center">
                {t('home.watchlist.emptyTitle')}
              </Text>
              <Text className="text-textSecondary text-sm text-center mb-6 leading-5">
                {t('home.watchlist.emptySub')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/swipe')}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{t('home.watchlist.discoverBtn')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION RECOMMANDATIONS (Liste Verticale) */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', width: 192 }}>{t('home.recommendations.title')}</Text>
          </View>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#8A3AFF" />
            </View>
          ) : (
            <View className="gap-4">
              {recommendations.map((movie) => (
                <TouchableOpacity
                  key={movie.id}
                  onPress={() => openInfoModal(movie)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', backgroundColor: colors.card, padding: 12, borderRadius: 16 }}>
                    <Image
                      source={getPosterSource(movie)}
                      className="w-24 h-32 rounded-xl"
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 16, justifyContent: 'space-between', paddingVertical: 4 }}>
                      <View>
                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }} numberOfLines={2}>{movie.title}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                          {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                        </Text>
                        <View className="flex-row gap-2 mt-2 flex-wrap">
                          {movie.genres.map((genre, idx) => (
                            <View key={idx} className="bg-[#8A3AFF]/20 px-2 py-1 rounded-md">
                              <Text className="text-[#9D8FFF] text-[10px] font-bold">{genre}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <FontAwesome name="star" size={12} color="#FACC15" />
                        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>{movie.vote_average.toFixed(1)}</Text>

                        {movie.matchPercentage >= 75 ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6 }}>
                            <FontAwesome5 name="crown" size={10} color="#1A1A2E" solid />
                            <Text style={{ color: '#1A1A2E', fontWeight: 'bold', fontSize: 10, marginLeft: 4 }}>TOP</Text>
                          </View>
                        ) : (
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4 }}>({movie.matchPercentage}{t('home.recommendations.match')})</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {recommendations.length === 0 && (
                <Text className="text-textSecondary text-center py-4">{t('home.recommendations.none')}</Text>
              )}
            </View>
          )}
        </View>


        {/* SECTION GENRES PRÉFÉRÉS */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
              {t('home.favoriteGenres')}
            </Text>

            <GenrePieChart data={genreData} />
          </View>
        </View>

        {/* SECTION CTA DISCOVER */}
        <View className="px-6 mb-8">
          <View className="rounded-3xl overflow-hidden">
            <LinearGradient
              colors={['#FF4FFD', '#8A3AFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 32 }}
            >
              <View className="items-center">
                <View className="mb-4">
                  <FontAwesome5 name="fire" size={32} color="white" />
                </View>

                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>{t('home.readyTitle')}</Text>

                <Text className="text-white/90 text-sm mb-8 text-center leading-5">
                  {t('home.readySub')}
                </Text>

                <TouchableOpacity
                  onPress={() => router.push('/swipe')}
                  className="bg-white w-full py-4 rounded-full items-center justify-center shadow-lg"
                  activeOpacity={0.9}
                >
                  <Text className="text-[#8A3AFF] font-bold text-base">{t('home.startBtn')}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>


      </ScrollView>

      {/* BOTTOM NAV FIXE */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 24 }}>
        <TouchableOpacity style={{ alignItems: 'center', gap: 4 }}>
          <FontAwesome5 name="home" size={20} color="#8A3AFF" />
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#8A3AFF' }}>{t('tabs.home')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/swipe')} style={{ alignItems: 'center', gap: 4 }}>
          <FontAwesome5 name="layer-group" size={20} color={colors.textSecondary} />
          <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textSecondary }}>{t('tabs.discover')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/settings')} style={{ alignItems: 'center', gap: 4 }}>
          <FontAwesome5 name="user" size={20} color={colors.textSecondary} />
          <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textSecondary }}>{t('tabs.profile')}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeInfoModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <Animated.View
            style={[
              {
                flex: 1,
                justifyContent: 'flex-end',
              },
              modalAnimatedStyle,
            ]}
          >
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', height: '85%' }}>
              <ScrollView
                className="flex-1"
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                {selectedMovie && (
                  <>
                    <View className="relative h-80 w-full">
                      {getPosterSource(selectedMovie) && (
                        <Image
                          source={getPosterSource(selectedMovie)}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      )}
                      <LinearGradient
                        colors={['transparent', isDark ? 'rgba(21, 21, 33, 0.8)' : 'rgba(255, 255, 255, 0.8)', colors.card]}
                        locations={[0, 0.6, 1]}
                        className="absolute bottom-0 left-0 right-0 h-48"
                      />
                    </View>

                    <View className="px-6 -mt-12 pb-10 relative z-10">
                      <View className="flex-row justify-between items-end mb-4">
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 28,
                            fontWeight: 'bold',
                            flex: 1,
                            marginRight: 16,
                            lineHeight: 34,
                            textShadowColor: 'rgba(0, 0, 0, 0.8)',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 6
                          }}
                        >
                          {selectedMovie.title}
                        </Text>
                        <View className="bg-[#8A3AFF] px-3 py-1.5 rounded-xl flex-row items-center shadow-lg shadow-[#8A3AFF]/30">
                          <FontAwesome name="star" size={14} color="#FACC15" solid />
                          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', marginLeft: 6, fontSize: 16 }}>
                            {selectedMovie.vote_average.toFixed(1)}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mb-6">
                        <View className="bg-[#22C55E]/20 px-2.5 py-1 rounded-md mr-3 border border-[#22C55E]/30">
                          <Text className="text-[#22C55E] font-bold text-xs">
                            {selectedMovieMatch}% Recommandé
                          </Text>
                        </View>
                        <FontAwesome name="calendar" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                        <Text className="text-textSecondary font-medium text-base">
                          {new Date(selectedMovie.release_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                      </View>

                      <View className="flex-row flex-wrap mb-8 gap-2">
                        {selectedMovieGenres.map((genre, index) => (
                          <View
                            key={index}
                            className="bg-[#8A3AFF]/15 border border-[#8A3AFF]/30 px-4 py-1.5 rounded-full"
                          >
                            <Text className="text-[#9D8FFF] text-sm font-medium">{genre}</Text>
                          </View>
                        ))}
                      </View>

                      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 8 }}>Casting</Text>
                      <View className="-mx-6 mb-8">
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ paddingHorizontal: 24 }}
                        >
                          {selectedMovieCast.map((actor, index) => (
                            <View key={index} style={{ marginRight: 16, width: 80, alignItems: 'center' }}>
                              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 18 }}>
                                  {actor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </Text>
                              </View>
                              <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold', textAlign: 'center', width: '100%', lineHeight: 14 }} numberOfLines={2}>
                                {actor.name}
                              </Text>
                              <Text style={{ color: colors.textSecondary, fontSize: 10, textAlign: 'center', width: '100%', lineHeight: 12, marginTop: 2 }} numberOfLines={2}>
                                {actor.role}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>

                      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Synopsis</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 28, paddingBottom: 128 }}>
                        {selectedMovie.overview || 'Aucune description disponible pour ce film.'}
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: colors.card }}>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleToggleLike}
                    className={`h-14 w-14 rounded-2xl items-center justify-center ${isSelectedMovieLiked
                      ? 'bg-red-500'
                      : 'bg-red-500/20 border border-red-500'
                      }`}
                    activeOpacity={0.8}
                  >
                    <FontAwesome
                      name="heart"
                      size={20}
                      color={isSelectedMovieLiked ? "white" : "#EF4444"}
                      solid={isSelectedMovieLiked}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleToggleWatchlist}
                    className={`flex-1 py-4 rounded-2xl items-center ${isSelectedMovieInWatchlist
                      ? 'bg-orange-500'
                      : 'bg-orange-500/20 border border-orange-500'
                      }`}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center gap-2">
                      <FontAwesome
                        name="bookmark"
                        size={18}
                        color={isSelectedMovieInWatchlist ? "white" : "#F59E0B"}
                        solid={isSelectedMovieInWatchlist}
                      />
                      <Text className={`font-bold ${isSelectedMovieInWatchlist ? 'text-white' : 'text-orange-500'}`}>
                        {isSelectedMovieInWatchlist ? 'Dans ma liste' : 'À voir'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={closeInfoModal}
                    style={{ backgroundColor: colors.card, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: colors.text, fontWeight: 'bold' }}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal >

      {/* MODAL WATCHLIST */}
      < Modal
        visible={showWatchlistModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeWatchlistModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <Animated.View
            style={[
              {
                flex: 1,
                justifyContent: 'flex-end',
              },
              watchlistModalAnimatedStyle,
            ]}
          >
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', height: '85%' }}>
              {/* Header */}
              <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-[#F59E0B]/20 rounded-full items-center justify-center">
                      <FontAwesome name="bookmark" size={18} color="#F59E0B" />
                    </View>
                    <View>
                      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>À voir</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{allWatchlistMovies.length} films</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={closeWatchlistModal} style={{ width: 40, height: 40, backgroundColor: colors.card, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <FontAwesome5 name="times" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Liste des films */}
              <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
              >
                {allWatchlistMovies.length > 0 ? (
                  <View className="gap-4">
                    {allWatchlistMovies.map((movie) => (
                      <TouchableOpacity
                        key={movie.id}
                        onPress={() => {
                          closeWatchlistModal();
                          setTimeout(() => openInfoModalById(movie.id), 350);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', backgroundColor: colors.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                          <Image
                            source={getPosterSource(movie)}
                            className="w-24 h-32 rounded-xl"
                            resizeMode="cover"
                          />
                          <View className="flex-1 ml-4 justify-between py-1">
                            <View>
                              <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }} numberOfLines={2}>{movie.title}</Text>
                              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                                {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <View className="flex-row items-center gap-1">
                                <FontAwesome name="star" size={12} color="#FACC15" />
                                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>{movie.vote_average.toFixed(1)}</Text>
                              </View>
                              <View className="bg-[#F59E0B]/20 px-2 py-1 rounded-md">
                                <Text className="text-[#F59E0B] text-[10px] font-bold">Dans ma liste</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="items-center py-16">
                    <FontAwesome name="bookmark-o" size={64} color={colors.textSecondary} />
                    <Text className="text-textSecondary text-lg font-bold mt-6 mb-2 text-center">
                      Votre liste est vide
                    </Text>
                    <Text className="text-textSecondary text-sm text-center mb-8 leading-5">
                      Ajoutez des films depuis la découverte{"\n"}ou les recommandations
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        closeWatchlistModal();
                        router.push('/swipe');
                      }}
                      className="bg-[#F59E0B] px-6 py-3 rounded-full"
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Découvrir des films</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL LIKED */}
      <Modal
        visible={showLikesModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeLikesModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <Animated.View
            style={[
              {
                flex: 1,
                justifyContent: 'flex-end',
              },
              likesModalAnimatedStyle,
            ]}
          >
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', height: '85%' }}>

              {/* HEADER */}
              <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-[#EF4444]/20 rounded-full items-center justify-center">
                      <FontAwesome name="heart" size={18} color="#EF4444" />
                    </View>
                    <View>
                      <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>{t('likedMovies.title')}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                      {allLikedMovies.length} {allLikedMovies.length > 1 ? t('likedMovies.moviesPlural') : t('likedMovies.movieSingular')}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={closeLikesModal}
                    style={{ width: 40, height: 40, backgroundColor: colors.card, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                  >
                    <FontAwesome5 name="times" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* LISTE DES FILMS */}
              <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
              >
                {allLikedMovies.length > 0 ? (
                  <View className="gap-4">
                    {allLikedMovies.map((movie) => (
                      <TouchableOpacity
                        key={movie.id}
                        onPress={() => {
                          closeLikesModal();
                          setTimeout(() => openInfoModalById(movie.id), 350);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', backgroundColor: colors.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                          <Image
                            source={getPosterSource(movie)}
                            className="w-24 h-32 rounded-xl"
                            resizeMode="cover"
                          />

                          <View className="flex-1 ml-4 justify-between py-1">
                            <View>
                              <Text
                                style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}
                                numberOfLines={2}
                              >
                                {movie.title}
                              </Text>
                              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                                {movie.release_date
                                  ? movie.release_date.split('-')[0]
                                  : 'N/A'}
                              </Text>
                            </View>

                            <View className="flex-row items-center gap-2">
                              <View className="flex-row items-center gap-1">
                                <FontAwesome name="star" size={12} color="#FACC15" />
                                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>
                                  {movie.vote_average.toFixed(1)}
                                </Text>
                              </View>

                              <View className="bg-[#EF4444]/20 px-2 py-1 rounded-md">
                                <Text className="text-[#EF4444] text-[10px] font-bold">
                                  {t('likedMovies.likedBadge')}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="items-center py-16">
                    <FontAwesome name="heart-o" size={64} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8, textAlign: 'center' }}>
                      {t('likedMovies.emptyTitle')}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
                      {t('likedMovies.emptySub')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        closeLikesModal();
                        router.push('/swipe');
                      }}
                      className="bg-[#EF4444] px-6 py-3 rounded-full"
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                        {t('likedMovies.discoverBtn')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}