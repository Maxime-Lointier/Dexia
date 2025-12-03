import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

import { getPosterById } from '../src/utils/posterMap';
import { Movie, getMoviesByGenresAndKeywords, getMovieGenreById, getRandomMovies, getMovieGenreIdById, getMovieById } from '../src/models/movies';
import { getUserPreferences, CURRENT_USER_ID, setOnboardingDone } from '../src/models/user';
import { getUserSeenMovieIds, getWatchlistMovies, getWatchlistCount, isInWatchlist, toggleWatchlist, cleanupInteractionsIfNeeded } from '../src/models/interaction';
import { getMovieCast, Cast } from '../src/models/cast';

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
  const [isSelectedMovieInWatchlist, setIsSelectedMovieInWatchlist] = useState(false);
  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);

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
      const userId = CURRENT_USER_ID;
      const movies = await getWatchlistMovies(userId);
      const count = await getWatchlistCount(userId);
      console.log(`📋 HomeScreen: ${movies.length} films, count=${count}`);
      setWatchlistMovies(movies.slice(0, 6)); // Limite à 6 pour l'affichage horizontal
      setWatchlistCount(count);
    } catch (error) {
      console.error('Erreur chargement watchlist:', error);
    }
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const userId = CURRENT_USER_ID;
      
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
      
      // Charger également la watchlist
      await loadWatchlist();
    } catch (error) {
      console.error("Erreur chargement recommandations home:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
      // Recharger aussi la watchlist quand on revient sur cet écran
      loadWatchlist();
    }, [])
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

      // Vérifier si le film est dans la watchlist
      const inWatchlist = await isInWatchlist(CURRENT_USER_ID, movie.id);
      setIsSelectedMovieInWatchlist(inWatchlist);
    } catch (error) {
      console.error('Erreur chargement détails film:', error);
      setSelectedMovieGenres([]);
      setSelectedMovieCast([]);
      setIsSelectedMovieInWatchlist(false);
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
      const movie = await getMovieById(movieId);
      if (movie) {
        const preferences = await getUserPreferences(CURRENT_USER_ID);
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

  const handleToggleWatchlist = async () => {
    if (!selectedMovie) return;
    
    try {
      const success = await toggleWatchlist(CURRENT_USER_ID, selectedMovie.id);
      if (success) {
        setIsSelectedMovieInWatchlist(!isSelectedMovieInWatchlist);
        // Recharger la watchlist pour mettre à jour l'affichage immédiatement
        await loadWatchlist();
      }
    } catch (error) {
      console.error('Erreur toggle watchlist:', error);
    }
  };

  const handleResetOnboarding = async () => {
    console.log("🔄 Reset de l'onboarding demandé...");
    
    // Vider immédiatement l'état local
    setWatchlistMovies([]);
    setWatchlistCount(0);
    
    await setOnboardingDone(CURRENT_USER_ID, false);
    router.replace('/welcomeScreen');
  };

  return (
    <View className="flex-1 bg-dark">
      <StatusBar style="light" />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View className="px-6 pt-14 pb-6 flex-row justify-between items-start">
          <View>
            <Text className="text-white text-3xl font-bold">Dexia</Text>
            <Text className="text-gray-400 text-sm mt-1">Découvrez vos prochains films</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/settings')} 
            className="w-10 h-10 bg-darkCard rounded-full items-center justify-center"
          >
            <FontAwesome5 name="user" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* SECTION STATS */}
        <View className="px-6 mb-8">
          <View className="flex-row gap-3">
            {/* Carte 1 : Films aimés */}
            <View className="flex-1 bg-darkCard rounded-2xl p-4 items-center">
              <View className="w-10 h-10 bg-[#6C5CE7]/20 rounded-full items-center justify-center mb-2">
                <FontAwesome name="heart" size={18} color="#6C5CE7" />
              </View>
              <Text className="text-white text-2xl font-bold">127</Text>
              <Text className="text-gray-400 text-[10px] uppercase font-medium mt-1">Films aimés</Text>
            </View>
            
            {/* Carte 2 : À voir */}
            <View className="flex-1 bg-darkCard rounded-2xl p-4 items-center">
              <View className="w-10 h-10 bg-[#F59E0B]/20 rounded-full items-center justify-center mb-2">
                <FontAwesome name="bookmark" size={18} color="#F59E0B" />
              </View>
              <Text className="text-white text-2xl font-bold">{watchlistCount}</Text>
              <Text className="text-gray-400 text-[10px] uppercase font-medium mt-1">À voir</Text>
            </View>
            
            {/* Carte 3 : Jours actif */}
            <View className="flex-1 bg-darkCard rounded-2xl p-4 items-center">
              <View className="w-10 h-10 bg-[#22C55E]/20 rounded-full items-center justify-center mb-2">
                <FontAwesome5 name="fire" size={18} color="#22C55E" />
              </View>
              <Text className="text-white text-2xl font-bold">12</Text>
              <Text className="text-gray-400 text-[10px] uppercase font-medium mt-1">Jours actif</Text>
            </View>
          </View>
        </View>

        {/* SECTION À VOIR PLUS TARD (Scroll Horizontal) */}
        <View className="mb-8">
          <View className="px-6 flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-bold">À voir plus tard</Text>
            <TouchableOpacity>
              <Text className="text-primary text-xs font-bold">Tout voir</Text>
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
                        <FontAwesome5 name="image" size={24} color="#6B7280" />
                      </View>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} className="absolute inset-0" />
                    <View className="absolute top-2 right-2 w-7 h-7 bg-[#F59E0B] rounded-full items-center justify-center">
                      <FontAwesome name="bookmark" size={12} color="white" />
                    </View>
                    <View className="absolute bottom-2 left-2 flex-row items-center gap-1">
                      <FontAwesome name="star" size={10} color="#FACC15" />
                      <Text className="text-white text-xs font-bold">{movie.vote_average.toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text className="text-white text-sm font-bold truncate" numberOfLines={1}>{movie.title}</Text>
                  <Text className="text-gray-500 text-[10px]">{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View className="items-center py-8 px-6">
              <FontAwesome name="bookmark-o" size={48} color="#6B7280" />
              <Text className="text-gray-400 text-lg font-bold mt-4 mb-2 text-center">
                Votre liste est vide
              </Text>
              <Text className="text-gray-500 text-sm text-center mb-6 leading-5">
                Ajoutez des films depuis la découverte ou les recommandations
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/swipe')}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-bold">Découvrir des films</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION RECOMMANDATIONS (Liste Verticale) */}
        <View className="px-6 mb-8">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-lg font-bold w-48">Recommandations personnalisées</Text>
            </View>

            {loading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#6C5CE7" />
              </View>
            ) : (
              <View className="gap-4">
                  {recommendations.map((movie) => (
                    <TouchableOpacity 
                      key={movie.id}
                      onPress={() => openInfoModal(movie)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row bg-darkCard p-3 rounded-2xl">
                          <Image 
                            source={getPosterSource(movie)} 
                            className="w-24 h-32 rounded-xl" 
                            resizeMode="cover" 
                          />
                          <View className="flex-1 ml-4 justify-between py-1">
                              <View>
                                  <Text className="text-white text-lg font-bold" numberOfLines={2}>{movie.title}</Text>
                                  <Text className="text-gray-400 text-xs mt-1">
                                    {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
                                  </Text>
                                  <View className="flex-row gap-2 mt-2 flex-wrap">
                                      {movie.genres.map((genre, idx) => (
                                        <View key={idx} className="bg-[#6C5CE7]/20 px-2 py-1 rounded-md">
                                          <Text className="text-[#9D8FFF] text-[10px] font-bold">{genre}</Text>
                                        </View>
                                      ))}
                                  </View>
                              </View>
                              <View className="flex-row items-center gap-1">
                                  <FontAwesome name="star" size={12} color="#FACC15" />
                                  <Text className="text-white font-bold text-sm">{movie.vote_average.toFixed(1)}</Text>
                                  <Text className="text-gray-500 text-xs ml-1">({movie.matchPercentage}% match)</Text>
                              </View>
                          </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {recommendations.length === 0 && (
                    <Text className="text-gray-400 text-center py-4">Aucune recommandation pour le moment.</Text>
                  )}
              </View>
            )}
        </View>

        {/* SECTION CTA DISCOVER */}
        <View className="px-6 mb-8">
          <View className="rounded-3xl overflow-hidden">
            <LinearGradient 
              colors={['#6C5CE7', '#A29BFE']} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 0}} 
              style={{ padding: 32 }}
            >
              <View className="items-center">
                <View className="mb-4">
                  <FontAwesome5 name="fire" size={32} color="white" />
                </View>
                
                <Text className="text-white text-xl font-bold mb-2 text-center">Prêt à découvrir ?</Text>
                
                <Text className="text-white/90 text-sm mb-8 text-center leading-5">
                  Swipez pour trouver votre prochain film préféré
                </Text>
                
                <TouchableOpacity 
                  onPress={() => router.push('/swipe')} 
                  className="bg-white w-full py-4 rounded-full items-center justify-center shadow-lg"
                  activeOpacity={0.9}
                >
                  <Text className="text-[#6C5CE7] font-bold text-base">Commencer</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View className="px-6 mb-8 mt-4 border-t border-gray-800 pt-6">
            <Text className="text-gray-500 text-xs text-center mb-4 uppercase tracking-widest">Zone de Développement</Text>
            
            <TouchableOpacity 
                onPress={handleResetOnboarding}
                className="bg-red-500/10 border border-red-500/50 py-3 rounded-xl items-center flex-row justify-center gap-2"
            >
                <FontAwesome5 name="undo" size={14} color="#EF4444" />
                <Text className="text-red-500 font-bold text-sm">Reset Onboarding (pour tester première connexion)</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* BOTTOM NAV FIXE */}
      <View className="absolute bottom-0 left-0 right-0 bg-dark border-t border-gray-900 px-6 py-4 flex-row justify-around pb-6">
        <TouchableOpacity className="items-center gap-1">
          <FontAwesome5 name="home" size={20} color="#6C5CE7" />
          <Text className="text-[10px] font-medium text-primary">Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/swipe')} className="items-center gap-1">
          <FontAwesome5 name="layer-group" size={20} color="#9CA3AF" />
          <Text className="text-[10px] font-medium text-gray-400">Découvrir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/settings')} className="items-center gap-1">
          <FontAwesome5 name="user" size={20} color="#9CA3AF" />
          <Text className="text-[10px] font-medium text-gray-400">Profil</Text>
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
            <View className="bg-[#151521] rounded-t-[32px] overflow-hidden h-[85%]">
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
                        colors={['transparent', 'rgba(21, 21, 33, 0.8)', '#151521']}
                        locations={[0, 0.6, 1]}
                        className="absolute bottom-0 left-0 right-0 h-48"
                      />
                    </View>

                    <View className="px-6 -mt-12 pb-10 relative z-10">
                      <View className="flex-row justify-between items-end mb-4">
                        <Text 
                          className="text-white text-3xl font-bold flex-1 mr-4 leading-tight"
                          style={{ 
                            textShadowColor: 'rgba(0, 0, 0, 0.75)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 4
                          }}
                        >
                          {selectedMovie.title}
                        </Text>
                        <View className="bg-[#6C5CE7] px-3 py-1.5 rounded-xl flex-row items-center shadow-lg shadow-[#6C5CE7]/30">
                          <FontAwesome name="star" size={14} color="#FACC15" solid />
                          <Text className="text-white font-bold ml-1.5 text-base">
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
                        <Text className="text-gray-400 font-medium text-base">
                          {new Date(selectedMovie.release_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                      </View>

                      <View className="flex-row flex-wrap mb-8 gap-2">
                        {selectedMovieGenres.map((genre, index) => (
                          <View 
                            key={index}
                            className="bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 px-4 py-1.5 rounded-full"
                          >
                            <Text className="text-[#9D8FFF] text-sm font-medium">{genre}</Text>
                          </View>
                        ))}
                      </View>

                      <Text className="text-white text-xl font-bold mb-3 mt-2">Casting</Text>
                      <View className="-mx-6 mb-8">
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false} 
                          contentContainerStyle={{ paddingHorizontal: 24 }}
                        >
                          {selectedMovieCast.map((actor, index) => (
                            <View key={index} className="mr-4 w-20 items-center">
                              <View className="w-20 h-20 rounded-full bg-[#2A2A3A] mb-2 overflow-hidden border border-white/10 items-center justify-center shadow-sm">
                                <View className="items-center justify-center w-full h-full bg-gradient-to-br from-gray-700 to-gray-800">
                                  <Text className="text-white/30 font-bold text-lg">
                                    {actor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </Text>
                                </View>
                              </View>
                              <Text className="text-white text-xs font-bold text-center w-full leading-tight" numberOfLines={2}>
                                {actor.name}
                              </Text>
                              <Text className="text-gray-400 text-[10px] text-center w-full leading-tight mt-0.5" numberOfLines={2}>
                                {actor.role}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>

                      <Text className="text-white text-xl font-bold mb-3">Synopsis</Text>
                      <Text className="text-gray-400 text-base leading-7 pb-32">
                        {selectedMovie.overview || 'Aucune description disponible pour ce film.'}
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>

              <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#151521] to-transparent">
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={handleToggleWatchlist}
                    className={`flex-1 py-4 rounded-2xl items-center ${
                      isSelectedMovieInWatchlist 
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
                        {isSelectedMovieInWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={closeInfoModal}
                    className="bg-gray-600 px-6 py-4 rounded-2xl"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-bold">Fermer</Text>
                  </TouchableOpacity>
                </View>
            </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}