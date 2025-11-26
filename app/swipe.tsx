import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
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

import { Movie, getMoviesByGenresAndKeywords, getTopRatedMovies, getMovieGenreById } from '../src/models/movies';
import { getUserPreferences, CURRENT_USER_ID } from '../src/models/user';
import { getUserSeenMovieIds, addInteraction, ActionType } from '../src/models/interaction';
import { getPosterById } from '../src/utils/posterMap';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

const SwipeScreen = () => {
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentGenres, setCurrentGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    loadMovies();
  }, []);

  useEffect(() => {
    if (movies.length > 0 && currentMovieIndex < movies.length) {
      loadGenresForMovie(movies[currentMovieIndex].id);
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
    }
  }, [currentMovieIndex, movies]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const userId = CURRENT_USER_ID;
      const preferences = await getUserPreferences(userId);
      const seenIds = await getUserSeenMovieIds(userId);

      let moviesData: Movie[] = [];

      if (preferences.genres && preferences.genres.length > 0) {
        moviesData = await getMoviesByGenresAndKeywords(
          preferences.genres,
          preferences.keywords,
          seenIds,
          20
        );
      }

      if (moviesData.length === 0) {
        moviesData = await getTopRatedMovies(20);
      }

      setMovies(moviesData);
      if (moviesData.length > 0) {
        loadGenresForMovie(moviesData[0].id);
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

    if (currentMovieIndex < movies.length - 1) {
      setCurrentMovieIndex(currentMovieIndex + 1);
    } else {
      await loadMovies();
      setCurrentMovieIndex(0);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const actionType = direction === 'right' ? 'like' : 'dislike';
    goToNextMovie(actionType);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.1;
      
      const distance = Math.abs(e.translationX);
      opacity.value = interpolate(
        distance,
        [0, SCREEN_WIDTH],
        [1, 0.3],
        Extrapolate.CLAMP
      );
    })
    .onEnd((e) => {
      const swipeDistance = e.translationX;
      
      if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
        const direction = swipeDistance > 0 ? 'right' : 'left';
        translateX.value = withSpring(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { damping: 18, stiffness: 120 }
        );
        opacity.value = withSpring(0, { damping: 18, stiffness: 120 });
        runOnJS(handleSwipeComplete)(direction);
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 120 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
        opacity.value = withSpring(1, { damping: 18, stiffness: 120 });
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
    modalOpacity.value = withTiming(1, { duration: 200 });
  };

  const closeInfoModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setShowInfoModal)(false);
    });
  };

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: modalOpacity.value,
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

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F1E]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />

      {/* Header */}
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
          <Icon name="filter" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Zone de swipe */}
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
                backgroundColor: 'rgba(30, 30, 46, 0.95)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                shadowColor: '#6C5CE7',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
                height: '100%',
              }}
              className="rounded-3xl flex-col"
            >
              {/* Poster - Prend 55% de la hauteur */}
              <View style={{ height: '55%', width: '100%', position: 'relative' }}>
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
                
                {/* Note */}
                <View className="absolute top-4 right-4 bg-[#6C5CE7]/90 px-3 py-1.5 rounded-full flex-row items-center shadow-sm">
                  <Icon name="star" size={14} color="white" />
                  <Text className="text-white font-semibold ml-1.5">
                    {currentMovie.vote_average.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Contenu - Prend 45% de la hauteur */}
              <View style={{ height: '45%', padding: 16, flexDirection: 'column', justifyContent: 'space-between' }}>
                
                {/* Genres - Hauteur fixe pour éviter les sauts */}
                <View style={{ height: 28, marginBottom: 8 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {currentGenres.map((genre, index) => (
                      <View 
                        key={index}
                        className="bg-gray-700/80 px-3 py-1 rounded-full mr-2"
                      >
                        <Text className="text-white text-xs">{genre}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Titre - Max 2 lignes */}
                <View style={{ flex: 1, justifyContent: 'center', marginBottom: 4 }}>
                  <Text 
                    className="text-white text-xl font-bold" 
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    style={{ lineHeight: 24 }}
                  >
                    {currentMovie.title}
                  </Text>
                </View>

                {/* Métadonnées */}
                <View className="flex-row items-center mb-3">
                  <View className="flex-row items-center mr-4">
                    <Icon name="calendar" size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 ml-2 text-xs">{getYear(currentMovie.release_date)}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Icon name="clock" size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 ml-2 text-xs">-</Text>
                  </View>
                </View>

                {/* Synopsis - Court */}
                <View style={{ height: 36, marginBottom: 12 }}>
                  <Text 
                    className="text-gray-300 text-xs leading-4" 
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {currentMovie.overview || 'Aucune description disponible.'}
                  </Text>
                </View>

                {/* Bouton Plus d'informations */}
                <TouchableOpacity 
                  onPress={openInfoModal}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                  className="w-full py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  <Icon name="info-circle" size={16} color="white" />
                  <Text className="text-white font-medium ml-2 text-sm">Plus d'informations</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Boutons d'action */}
      <View className="absolute bottom-0 left-0 right-0 px-6 py-6 bg-[#0F0F1E]/95 border-t border-white/5">
        <View className="flex-row justify-around items-center">
          <TouchableOpacity 
            onPress={() => {
              translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 18, stiffness: 120 });
              opacity.value = withSpring(0, { damping: 18, stiffness: 120 });
              handleSwipeComplete('left');
            }}
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
            onPress={() => goToNextMovie('favorite')}
            className="w-16 h-16 bg-[#6C5CE7] rounded-full items-center justify-center"
          >
            <Icon name="star" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity className="w-14 h-14 bg-[#1E1E2E] rounded-full items-center justify-center">
            <Icon name="bookmark" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              translateX.value = withSpring(SCREEN_WIDTH * 1.5, { damping: 18, stiffness: 120 });
              opacity.value = withSpring(0, { damping: 18, stiffness: 120 });
              handleSwipeComplete('right');
            }}
            className="w-14 h-14 bg-green-600 rounded-full items-center justify-center"
          >
            <Icon name="heart" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Plus d'informations */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeInfoModal}
      >
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            },
            modalAnimatedStyle,
          ]}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 justify-center px-6">
              <View
                style={{
                  backgroundColor: 'rgba(30, 30, 46, 0.95)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  shadowColor: '#6C5CE7',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  elevation: 12,
                  maxHeight: SCREEN_HEIGHT * 0.85,
                }}
                className="rounded-3xl overflow-hidden"
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {/* Header avec bouton fermer */}
                  <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
                    <Text className="text-white text-2xl font-bold">Détails du film</Text>
                    <TouchableOpacity
                      onPress={closeInfoModal}
                      className="w-10 h-10 items-center justify-center"
                    >
                      <Icon name="times" size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  {/* Poster */}
                  {posterSource && (
                    <View className="px-6 pb-4">
                      <Image
                        source={posterSource}
                        style={{ width: '100%', height: SCREEN_HEIGHT * 0.35, borderRadius: 16 }}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Titre */}
                  <View className="px-6 pb-3">
                    <Text className="text-white text-3xl font-bold">{currentMovie.title}</Text>
                  </View>

                  {/* Note et métadonnées */}
                  <View className="px-6 pb-4 flex-row items-center">
                    <View className="bg-[#6C5CE7]/90 px-3 py-1.5 rounded-full flex-row items-center mr-4">
                      <Icon name="star" size={16} color="white" />
                      <Text className="text-white font-semibold ml-1.5">
                        {currentMovie.vote_average.toFixed(1)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Icon name="calendar" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 ml-2">{getYear(currentMovie.release_date)}</Text>
                    </View>
                  </View>

                  {/* Genres */}
                  {currentGenres.length > 0 && (
                    <View className="px-6 pb-4">
                      <Text className="text-gray-400 text-sm mb-2">Genres</Text>
                      <View className="flex-row flex-wrap">
                        {currentGenres.map((genre, index) => (
                          <View
                            key={index}
                            className="bg-gray-700/80 px-3 py-1.5 rounded-full mr-2 mb-2"
                          >
                            <Text className="text-white text-sm">{genre}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Description complète */}
                  <View className="px-6 pb-4">
                    <Text className="text-gray-400 text-sm mb-2">Synopsis</Text>
                    <Text className="text-white text-base leading-6">
                      {currentMovie.overview || 'Aucune description disponible.'}
                    </Text>
                  </View>

                  {/* Informations supplémentaires */}
                  {currentMovie.release_date && (
                    <View className="px-6 pb-6">
                      <Text className="text-gray-400 text-sm mb-2">Informations</Text>
                      <View>
                        <View className="flex-row items-center mb-2">
                          <Text className="text-gray-500 text-sm w-24">Date de sortie:</Text>
                          <Text className="text-white text-sm">{currentMovie.release_date}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

export default SwipeScreen;
