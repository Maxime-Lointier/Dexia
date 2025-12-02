import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons'; 
import { router } from 'expo-router';

import { Genre, getAllGenres, getTopRatedMovies, Movie } from '../src/models/movies';

import { updateUserPreferences, getOrCreateUser } from '../src/models/user';

// Associe l'ID du genre à une couleur et une icône
const GENRE_STYLES: Record<number, { icon: string; color: string; iconColor: string }> = {
  28:  { icon: 'bomb', color: 'bg-red-700', iconColor: 'text-red-700' }, // Action
  12:  { icon: 'compass', color: 'bg-green-700', iconColor: 'text-green-700' }, // Aventure
  16:  { icon: 'film', color: 'bg-teal-700', iconColor: 'text-teal-700' }, // Animation
  35:  { icon: 'laugh', color: 'bg-yellow-600', iconColor: 'text-yellow-600' }, // Comédie
  80:  { icon: 'mask', color: 'bg-gray-800', iconColor: 'text-gray-800' }, // Crime
  99:  { icon: 'video', color: 'bg-amber-700', iconColor: 'text-amber-700' }, // Documentaire
  18:  { icon: 'theater-masks', color: 'bg-blue-700', iconColor: 'text-blue-700' }, // Drame
  10751:{ icon: 'users', color: 'bg-pink-500', iconColor: 'text-pink-500' }, // Famille
  14:  { icon: 'hat-wizard', color: 'bg-indigo-700', iconColor: 'text-indigo-700' }, // Fantastique
  36:  { icon: 'landmark', color: 'bg-stone-600', iconColor: 'text-stone-600' }, // Histoire
  27:  { icon: 'ghost', color: 'bg-orange-700', iconColor: 'text-orange-700' }, // Horreur
  10402:{ icon: 'music', color: 'bg-purple-600', iconColor: 'text-purple-600' }, // Musique
  9648: { icon: 'search', color: 'bg-cyan-700', iconColor: 'text-cyan-700' }, // Mystère
  10749:{ icon: 'heart', color: 'bg-pink-700', iconColor: 'text-pink-700' }, // Romance
  878:  { icon: 'rocket', color: 'bg-purple-700', iconColor: 'text-purple-700' }, // Sci-Fi
  53:   { icon: 'user-secret', color: 'bg-gray-900', iconColor: 'text-gray-900' }, // Thriller
  10752:{ icon: 'fighter-jet', color: 'bg-green-900', iconColor: 'text-green-900' }, // Guerre
  37:   { icon: 'horse', color: 'bg-yellow-800', iconColor: 'text-yellow-800' }, // Western
};

//En cas de genres non trouvés, on utilise un style par défaut
const DEFAULT_STYLE = { icon: 'film', color: 'bg-gray-600', iconColor: 'text-gray-600' };

const Onboarding = () => {
  //States pour données
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  //States pour l'UI
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
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
    <SafeAreaView className="flex-1 bg-[#0F0F1E]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
      
      {/* HEADER */}
      {/* Top Bar */}
      <View className="px-6 pt-2 pb-4">

        {/* Titres */}
        <View className="items-center mb-4">
            <Text className="text-white text-3xl font-bold mb-3 text-center">Vos genres préférés</Text>
            <Text className="text-gray-400 text-base text-center">
                Sélectionnez au moins 3 genres ({selectedGenres.length}/3)
            </Text>
        </View>
      </View>

      {/* CONTENU : si chargement, on affiche un loader, sinon on affiche la grille des genres*/}
      {loading ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text className="text-gray-400 mt-4">Chargement...</Text>
        </View>
      ) : (
        <ScrollView 
            className="px-6" 
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-row flex-wrap justify-between">
                {genres.map((genre) => {
                    // On vérifie si le genre est sélectionné
                    const isSelected = selectedGenres.includes(genre.id);
                    // On cherche le style correspondant à l'ID
                    const style = GENRE_STYLES[genre.id] || DEFAULT_STYLE;

                    return (
                        <TouchableOpacity
                            key={genre.id}
                            onPress={() => toggleGenre(genre.id)}
                            activeOpacity={0.8}
                            className={`w-[48%] h-32 mb-3 rounded-2xl p-4 justify-between overflow-hidden relative ${style.color}`}
                        >
                            {/* Overlay sombre si sélectionné */}
                            {isSelected && (
                                <View className="absolute inset-0 bg-black/40 z-0" />
                            )}

                            <View className="z-10 relative">
                                <Icon name={style.icon} size={24} color="white" style={{ marginBottom: 8 }} />
                                {/* Attention : ton modèle renvoie 'name' ou 'label' ? adapte ici */}
                                <Text className="text-white font-semibold text-lg">{genre.name}</Text>
                            </View>

                            {/* Icone Check */}
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

      {/* FOOTER : BOUTON CONTINUER */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#0F0F1E]/95 border-t border-white/5">
        <TouchableOpacity
            disabled={!isContinueEnabled}
            onPress={async () => {
                try {
                    console.log('Genres choisis:', selectedGenres);
                    // Obtenir ou créer le profil utilisateur unique de l'application
                    const userId = await getOrCreateUser();
                    await updateUserPreferences(userId, { genres: selectedGenres, keywords: [] });
                    router.replace('/homeScreen'); // On va vers la page d'accueil
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde des préférences:', error);
                }
            }}
            className={`w-full py-4 rounded-full items-center justify-center ${
                isContinueEnabled ? 'bg-[#6C5CE7]'  : 'bg-gray-700'
            }`}
        >
            <Text className={`font-semibold text-lg ${
                isContinueEnabled ? 'text-white' : 'text-gray-500'
            }`}>
                Continuer
            </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

export default Onboarding;