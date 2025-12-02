import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';

import { getTopRatedMovies, getRandomMovies, Movie } from '../src/models/movies';

export default function MainPage() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const randomFilms = await getRandomMovies(5);
        setWatchlist(randomFilms);

        const topFilms = await getTopRatedMovies(5);
        setRecommendations(topFilms);
      } catch (e) {
        console.error("Erreur chargement films:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getPosterSource = (path: string | null) => {
    if (!path) return { uri: 'https://via.placeholder.com/500x750?text=No+Image' };
    
    if (path.includes('assets/')) return { uri: 'https://via.placeholder.com/500x750?text=Local' };

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return { uri: `https://image.tmdb.org/t/p/w500${cleanPath}` };
  };

  if (loading) {
    return (
      <View className="flex-1 bg-dark justify-center items-center">
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* HEADER*/}
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
            <View className="flex-1 bg-darkCard rounded-2xl p-4 items-center">
              <View className="w-10 h-10 bg-[#6C5CE7]/20 rounded-full items-center justify-center mb-2">
                <FontAwesome name="heart" size={18} color="#6C5CE7" />
              </View>
              <Text className="text-white text-2xl font-bold">127</Text>
              <Text className="text-gray-400 text-[10px] uppercase font-medium mt-1">Films aimés</Text>
            </View>
            <View className="flex-1 bg-darkCard rounded-2xl p-4 items-center">
              <View className="w-10 h-10 bg-[#F59E0B]/20 rounded-full items-center justify-center mb-2">
                <FontAwesome name="bookmark" size={18} color="#F59E0B" />
              </View>
              <Text className="text-white text-2xl font-bold">34</Text>
              <Text className="text-gray-400 text-[10px] uppercase font-medium mt-1">À voir</Text>
            </View>
            <View className="flex-1 bg-darkCard rounded-2xl p-4 items-center">
              <View className="w-10 h-10 bg-[#22C55E]/20 rounded-full items-center justify-center mb-2">
                <FontAwesome5 name="fire" size={18} color="#22C55E" />
              </View>
              <Text className="text-white text-2xl font-bold">12</Text>
              <Text className="text-gray-400 text-[10px] uppercase font-medium mt-1">Jours actif</Text>
            </View>
          </View>
        </View>

        {/* SECTION À VOIR PLUS TARD*/}
        <View className="mb-8">
          <View className="px-6 flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-bold">À voir plus tard</Text>
            <TouchableOpacity>
              <Text className="text-primary text-xs font-bold">Tout voir</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
            {watchlist.map((movie) => (
              <TouchableOpacity key={movie.id} className="w-32">
                <View className="relative h-48 rounded-xl overflow-hidden mb-2">
                  <Image 
                    source={getPosterSource(movie.poster_path)} 
                    className="w-full h-full" 
                    resizeMode="cover" 
                  />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} className="absolute inset-0" />
                  <View className="absolute top-2 right-2 w-7 h-7 bg-[#F59E0B] rounded-full items-center justify-center">
                    <FontAwesome name="bookmark" size={12} color="white" />
                  </View>
                  <View className="absolute bottom-2 left-2 flex-row items-center gap-1">
                      <FontAwesome name="star" size={10} color="#FACC15" />
                      <Text className="text-white text-xs font-bold">{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</Text>
                  </View>
                </View>
                <Text className="text-white text-sm font-bold truncate" numberOfLines={1}>{movie.title}</Text>
                <Text className="text-gray-500 text-[10px]">
                    {movie.release_date ? movie.release_date.substring(0, 4) : 'Film'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SECTION RECOMMANDATIONS*/}
        <View className="px-6 mb-8">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-lg font-bold w-48">Recommandations personnalisées</Text>
                <TouchableOpacity><Text className="text-primary text-xs font-bold">Actualiser</Text></TouchableOpacity>
            </View>

            <View className="gap-4">
                {recommendations.map((movie) => (
                  <View key={movie.id} className="flex-row bg-darkCard p-3 rounded-2xl">
                      <Image 
                        source={getPosterSource(movie.poster_path)} 
                        className="w-24 h-32 rounded-xl" 
                        resizeMode="cover" 
                      />
                      <View className="flex-1 ml-4 justify-between py-1">
                          <View>
                              <Text className="text-white text-lg font-bold" numberOfLines={1}>{movie.title}</Text>
                              <Text className="text-gray-400 text-xs mt-1">
                                {movie.release_date ? movie.release_date.substring(0, 4) : '2023'} • Film
                              </Text>
                              
                              <View className="flex-row gap-2 mt-2">
                                  <View className="bg-purple-900/50 px-2 py-1 rounded-md">
                                    <Text className="text-purple-400 text-[10px] font-bold">Populaire</Text>
                                  </View>
                                  <View className="bg-gray-700/50 px-2 py-1 rounded-md">
                                    <Text className="text-gray-400 text-[10px] font-bold">HD</Text>
                                  </View>
                              </View>
                          </View>
                          <View className="flex-row items-center gap-1">
                              <FontAwesome name="star" size={12} color="#FACC15" />
                              <Text className="text-white font-bold text-sm">{movie.vote_average ? movie.vote_average.toFixed(1) : '?'}</Text>
                              <Text className="text-gray-500 text-xs ml-1">
                                ({Math.floor((movie.vote_average || 0) * 10)}% match)
                              </Text>
                          </View>
                      </View>
                  </View>
                ))}
            </View>
        </View>

        {/* SECTION CTA  */}
        <View className="px-6 mb-8">
          <View className="rounded-3xl overflow-hidden w-full">
            <LinearGradient 
              colors={['#6C5CE7', '#A29BFE']} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 0}} 
              className="p-8 items-center w-full"
            >
              <FontAwesome5 name="fire" size={32} color="white" style={{marginBottom: 12}} />
              
              <Text className="text-white text-lg font-bold mb-2">Prêt à découvrir ?</Text>
              <Text className="text-white/90 text-sm mb-6 text-center px-4">Swipez pour trouver votre prochain film préféré</Text>
              
              <TouchableOpacity 
                onPress={() => router.push('/swipe')} 
                className="bg-white w-full py-4 rounded-full items-center shadow-md"
              >
                <Text className="text-[#6C5CE7] font-bold text-lg">Commencer</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

      </ScrollView>

      {/* BOTTOM NAV  */}
      <View className="absolute bottom-0 left-0 right-0 bg-dark border-t border-gray-900 px-6 py-4 flex-row justify-around pb-6">
        <TouchableOpacity className="items-center gap-1">
          <FontAwesome5 name="home" size={20} color="#6C5CE7" />
          <Text className="text-[10px] font-medium text-primary">Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/swipe')} className="items-center gap-1">
          <FontAwesome5 name="layer-group" size={20} color="#9CA3AF" />
          <Text className="text-[10px] font-medium text-gray-400">Découvrir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center gap-1">
          <FontAwesome5 name="heart" size={20} color="#9CA3AF" />
          <Text className="text-[10px] font-medium text-gray-400">Favoris</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/settings')} className="items-center gap-1">
          <FontAwesome5 name="user" size={20} color="#9CA3AF" />
          <Text className="text-[10px] font-medium text-gray-400">Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}