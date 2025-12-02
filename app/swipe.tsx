import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
  withTiming,
} from 'react-native-reanimated';

import { Movie, getMoviesByGenresAndKeywords, getTopRatedMovies, getRandomMovies, getMovieGenreById, getMovieGenreIdById } from '../src/models/movies';
import { getMovieCast, Cast } from '../src/models/cast';
import { getUserPreferences, CURRENT_USER_ID } from '../src/models/user';
import { getUserSeenMovieIds, addInteraction, ActionType } from '../src/models/interaction';
import { getPosterById } from '../src/utils/posterMap';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

const SwipeScreen = () => {
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentGenres, setCurrentGenres] = useState<string[]>([]);
  const [currentCast, setCurrentCast] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [sessionLikedGenres, setSessionLikedGenres] = useState<number[]>([]);
  const BATCH_SIZE = 10;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const swipeOverlayOpacity = useSharedValue(0);

  useEffect(() => {
    loadMovies();
  }, []);

  useEffect(() => {
    if (movies.length > 0 && currentMovieIndex < movies.length) {
      const movieId = movies[currentMovieIndex].id;
      loadGenresForMovie(movieId);
      loadCastForMovie(movieId);
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
      swipeOverlayOpacity.value = 0;
    }
  }, [currentMovieIndex, movies]);

  const loadMovies = async (refresh = false) => {
    try {
      setLoading(true);
      const userId = CURRENT_USER_ID;
      const preferences = await getUserPreferences(userId);
      const seenIds = await getUserSeenMovieIds(userId);
      
      const currentMovieIds = movies.map(m => m.id);
      const excludeIds = [...new Set([...seenIds, ...currentMovieIds])];

      let moviesData: Movie[] = [];

      if (preferences.genres && preferences.genres.length > 0) {
        moviesData = await getMoviesByGenresAndKeywords(
          preferences.genres,
          preferences.keywords,
          excludeIds,
          BATCH_SIZE,
          sessionLikedGenres
        );
      }

      if (moviesData.length === 0) {
        moviesData = await getRandomMovies(BATCH_SIZE);
      }

      if (refresh) {
        setMovies(moviesData);
        setCurrentMovieIndex(0);
      } else {
        setMovies(prev => [...prev, ...moviesData]);
      }

      if (moviesData.length > 0 && (refresh || movies.length === 0)) {
        const firstMovieId = moviesData[0].id;
        loadGenresForMovie(firstMovieId);
        loadCastForMovie(firstMovieId);
      }
    } catch (error) {
      console.error('Erreur chargement films:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGenresForMovie = async (movieId: number) => {
    try {
      const genres = await getMovieGenreById(movieId);
      setCurrentGenres(genres.map(g => g.name));
    } catch (error) {
      console.error('Erreur chargement genres:', error);
      setCurrentGenres([]);
    }
  };

  const loadCastForMovie = async (movieId: number) => {
    try {
      const cast = await getMovieCast(movieId);
      setCurrentCast(cast);
    } catch (error) {
      console.error('Erreur chargement casting:', error);
      setCurrentCast([]);
    }
  };

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

  const goToNextMovie = async (actionType: ActionType) => {
    if (movies.length === 0) return;

    const currentMovie = movies[currentMovieIndex];
    await addInteraction(CURRENT_USER_ID, currentMovie.id, actionType);

    if (actionType === 'like') {
        const genresIds = await getMovieGenreIdById(currentMovie.id);
        setSessionLikedGenres(prev => [...new Set([...prev, ...genresIds])]);
    }

    if (currentMovieIndex < movies.length - 1) {
      const nextIndex = currentMovieIndex + 1;
      setCurrentMovieIndex(nextIndex);
      
      if (movies.length - nextIndex <= 2) {
        loadMovies(false);
      }
    } else {
      await loadMovies(true);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const actionType = direction === 'right' ? 'like' : 'dislike';
    goToNextMovie(actionType);
  };

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    const destinationX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    
    translateX.value = withTiming(destinationX, { duration: 350 }, (finished) => {
      if (finished) {
        runOnJS(handleSwipeComplete)(direction);
      }
    });
    opacity.value = withTiming(0, { duration: 350 });
  };

  const handleUndo = () => {
    if (currentMovieIndex > 0) {
      setCurrentMovieIndex(currentMovieIndex - 1);
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.1;
      
      const distance = Math.abs(e.translationX);
      opacity.value = interpolate(
        distance,
        [0, SCREEN_WIDTH],
        [1, 0.8], 
        Extrapolate.CLAMP
      );
      
      swipeOverlayOpacity.value = interpolate(
        Math.abs(e.translationX),
        [0, SCREEN_WIDTH * 0.25],
        [0, 1],
        Extrapolate.CLAMP
      );
    })
    .onEnd((e) => {
      const swipeDistance = e.translationX;
      
      if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
        const direction = swipeDistance > 0 ? 'right' : 'left';
        const destinationX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        
        translateX.value = withSpring(destinationX, {
          damping: 20,
          stiffness: 90,
          mass: 1
        });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleSwipeComplete)(direction);
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
          mass: 1
        });
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
          mass: 1
        });
        opacity.value = withTiming(1, { duration: 200 });
        swipeOverlayOpacity.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const getYear = (dateString: string): string => {
    if (!dateString) return '';
    return dateString.split('-')[0];
  };

  const openInfoModal = () => {
    setShowInfoModal(true);
    modalTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    });
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0F0F1E]">
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text className="text-gray-400 mt-4">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (movies.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0F0F1E]">
        <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-white text-xl text-center">Aucun film disponible</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentMovie = movies[currentMovieIndex];
  const posterSource = getPosterSource(currentMovie);
  
  const matchPercentage = Math.min(98, Math.round((currentMovie.vote_average * 10) + 5));

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F1E]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />

      <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
        <TouchableOpacity 
          onPress={() => router.push('/homeScreen')}
          className="flex-row items-center"
        >
          <View className="w-10 h-10 bg-[#6C5CE7] rounded-full items-center justify-center mr-3">
            <Icon name="film" size={20} color="white" />
          </View>
          <Text className="text-white text-2xl font-bold">Dexia</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <View style={{ width: 24, height: 24 }} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center items-center px-6" style={{ paddingBottom: 100 }}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              animatedCardStyle,
              {
                width: SCREEN_WIDTH - 48,
                height: SCREEN_HEIGHT * 0.65,
              },
            ]}
            className="rounded-3xl overflow-hidden"
          >
            <View
              style={{
                backgroundColor: '#1E1E2E',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
                height: '100%',
              }}
              className="rounded-3xl relative"
            >
              {posterSource ? (
                <Image 
                  source={posterSource} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-800 items-center justify-center">
                  <Icon name="image" size={64} color="#4B5563" />
                  <Text className="text-gray-500 mt-2">Poster indisponible</Text>
                </View>
              )}

              <LinearGradient
                colors={['transparent', 'rgba(15, 15, 30, 0.4)', 'rgba(15, 15, 30, 0.95)']}
                locations={[0, 0.3, 1]}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '60%',
                }}
              />

              <View className="absolute top-4 right-4 bg-[#6C5CE7]/90 px-3 py-1.5 rounded-full flex-row items-center shadow-sm z-10">
                <Icon name="star" size={14} color="#FACC15" solid />
                <Text className="text-white font-bold ml-1.5">
                  {currentMovie.vote_average.toFixed(1)}
                </Text>
              </View>

              <View className="absolute top-4 left-4 bg-[#22C55E]/90 px-3 py-1.5 rounded-full shadow-sm z-10">
                <Text className="text-white font-bold text-xs">
                  {matchPercentage}% Match
                </Text>
              </View>

              <View className="absolute bottom-0 left-0 right-0 p-5 pb-6 flex-col">
                <View className="flex-row flex-wrap mb-2">
                  {currentGenres.slice(0, 3).map((genre, index) => (
                    <View 
                      key={index}
                      className="bg-white/10 border border-white/10 px-2.5 py-1 rounded-md mr-2 mb-1"
                    >
                      <Text className="text-white/90 text-[10px] font-medium tracking-wide uppercase">{genre}</Text>
                    </View>
                  ))}
                </View>

                <Text 
                  className="text-white text-3xl font-bold mb-1 shadow-sm" 
                  numberOfLines={2}
                >
                  {currentMovie.title}
                </Text>

                <View className="flex-row items-center mb-3">
                  <Text className="text-gray-300 text-sm font-medium">
                    {getYear(currentMovie.release_date)}
                  </Text>
                </View>

                <Text 
                  className="text-gray-300 text-sm leading-5 mb-4" 
                  numberOfLines={2}
                >
                  {currentMovie.overview || 'Aucune description disponible.'}
                </Text>

                <TouchableOpacity 
                  onPress={openInfoModal}
                  className="flex-row items-center self-start"
                >
                  <Text className="text-[#6C5CE7] font-bold text-sm mr-1">En savoir plus</Text>
                  <Icon name="chevron-right" size={12} color="#6C5CE7" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      <View className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-[#0F0F1E]/95 border-t border-white/5">
        <View className="flex-row justify-around items-center">
          <TouchableOpacity 
            onPress={() => handleButtonSwipe('left')}
            className="w-14 h-14 bg-red-600 rounded-full items-center justify-center"
          >
            <Icon name="times" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={openInfoModal}
            className="w-14 h-14 bg-[#1E1E2E] rounded-full items-center justify-center"
          >
            <Icon name="info-circle" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/homeScreen')}
            className="w-16 h-16 bg-[#6C5CE7] rounded-full items-center justify-center"
          >
            <Icon name="home" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleUndo}
            className={`w-14 h-14 bg-[#1E1E2E] rounded-full items-center justify-center ${currentMovieIndex === 0 ? 'opacity-50' : ''}`}
            disabled={currentMovieIndex === 0}
          >
            <Icon name="undo" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleButtonSwipe('right')}
            className="w-14 h-14 bg-green-600 rounded-full items-center justify-center"
          >
            <Icon name="heart" size={24} color="white" />
          </TouchableOpacity>
        </View>
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
              <View 
                className="bg-[#151521] rounded-t-[32px] overflow-hidden h-[85%]"
              >
                <ScrollView 
                className="flex-1" 
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                <View className="relative h-80 w-full">
                  {posterSource && (
                    <Image
                      source={posterSource}
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
                      {currentMovie.title}
                    </Text>
                    <View className="bg-[#6C5CE7] px-3 py-1.5 rounded-xl flex-row items-center shadow-lg shadow-[#6C5CE7]/30">
                      <Icon name="star" size={14} color="#FACC15" solid />
                      <Text className="text-white font-bold ml-1.5 text-base">
                        {currentMovie.vote_average.toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mb-6">
                    <View className="bg-[#22C55E]/20 px-2.5 py-1 rounded-md mr-3 border border-[#22C55E]/30">
                      <Text className="text-[#22C55E] font-bold text-xs">
                        {matchPercentage}% Recommandé
                      </Text>
                    </View>
                    <Icon name="calendar-alt" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <Text className="text-gray-400 font-medium text-base">
                      {new Date(currentMovie.release_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap mb-8 gap-2">
                    {currentGenres.map((genre, index) => (
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
                      {currentCast.map((actor, index) => (
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
                    {currentMovie.overview || 'Aucune description disponible pour ce film.'}
                  </Text>
                </View>
              </ScrollView>

              <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#151521] to-transparent">
                <TouchableOpacity 
                  onPress={closeInfoModal}
                  className="bg-[#2A2A3A] w-full py-4 rounded-2xl items-center border border-white/10 shadow-lg"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-lg">Fermer</Text>
                </TouchableOpacity>
              </View>
              </View>
            </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SwipeScreen;