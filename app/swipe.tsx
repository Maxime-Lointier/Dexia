import React, { useRef, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
// @ts-ignore: Cette librairie n'a pas de définitions TypeScript officielles
import Swiper from "react-native-deck-swiper";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";

// --- 1. DÉFINITION DES TYPES ---
type Movie = {
  id: number;
  title: string;
  year: number;
  duration: string;
  genres: string[];
  rating: number;
  match: number;
  poster: string;
};

// --- 2. DONNÉES DE TEST (MOCK) ---
const MOCK_MOVIES: Movie[] = [
  {
    id: 1,
    title: "Inception",
    year: 2010,
    duration: "2h 28min",
    genres: ["Sci-Fi", "Thriller"],
    rating: 4.5,
    match: 91,
    poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
  },
  {
    id: 2,
    title: "Interstellar",
    year: 2014,
    duration: "2h 49min",
    genres: ["Sci-Fi", "Drame"],
    rating: 4.8,
    match: 96,
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniL6E8ahMcafHC7MEGcZEp.jpg",
  },
  {
    id: 3,
    title: "The Dark Knight",
    year: 2008,
    duration: "2h 32min",
    genres: ["Action", "Crime"],
    rating: 4.9,
    match: 94,
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  },
  {
    id: 4,
    title: "Blade Runner 2049",
    year: 2017,
    duration: "2h 44min",
    genres: ["Sci-Fi", "Thriller"],
    rating: 4.7,
    match: 89,
    poster: "https://image.tmdb.org/t/p/w500/63kGofwTzPPmsPhRaawq4fE1s3K.jpg",
  },
  {
    id: 5,
    title: "Parasite",
    year: 2019,
    duration: "2h 12min",
    genres: ["Thriller", "Drame"],
    rating: 4.9,
    match: 94,
    poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  },
];

// --- 3. SOUS-COMPOSANTS ---

// En-tête de l'application
const Header = () => (
  <View className="px-6 pt-14 pb-4 flex-row justify-between items-center z-10 bg-transparent">
    <TouchableOpacity
      onPress={() => router.back()}
      className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center"
    >
      <FontAwesome5 name="chevron-left" size={16} color="#9CA3AF" />
    </TouchableOpacity>

    <View className="items-center">
      <Text className="text-white text-xs uppercase tracking-[2px]">
        Découvrir
      </Text>
      <Text className="text-white text-2xl font-bold mt-1">Dexia Swipe</Text>
    </View>

    <TouchableOpacity
      onPress={() => router.push("/settings")}
      className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center"
    >
      <FontAwesome5 name="user" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  </View>
);

// Carte d'un film individuel
const MovieCard = ({ movie }: { movie: Movie }) => {
  // Sécurité : si le film est undefined, on ne rend rien
  if (!movie) return null;

  return (
    <View className="flex-1 bg-gray-900 rounded-3xl overflow-hidden shadow-xl border border-white/5 relative">
      <Image
        source={{ uri: movie.poster }}
        className="w-full h-full absolute"
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.95)"]}
        locations={[0, 0.6, 1]}
        className="absolute inset-0 justify-end p-6"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-2">
            <Text
              className="text-white font-bold text-3xl shadow-md"
              numberOfLines={2}
            >
              {movie.title}
            </Text>
            <Text className="text-gray-300 text-sm mt-1 font-medium">
              {movie.year} • {movie.duration}
            </Text>
          </View>

          <View className="items-end">
            <View className="flex-row items-center gap-1 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
              <FontAwesome name="star" size={14} color="#FACC15" />
              <Text className="text-white font-bold text-base">
                {movie.rating.toFixed(1)}
              </Text>
            </View>
            <Text className="text-emerald-400 text-xs mt-1 font-bold">
              {movie.match}% match
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 mt-2">
          {movie.genres.map((g) => (
            <View
              key={g}
              className="bg-white/20 px-3 py-1.5 rounded-full border border-white/10"
            >
              <Text className="text-white text-[11px] font-semibold tracking-wide">
                {g}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// Boutons d'action en bas (Rewind, Nope, Like, List)
interface ActionButtonsProps {
  onRewind: () => void;
  onDislike: () => void;
  onLike: () => void;
  onList: () => void;
}

const ActionButtons = ({
  onRewind,
  onDislike,
  onLike,
  onList,
}: ActionButtonsProps) => (
  <View className="px-10 pb-10 pt-2 flex-row justify-between items-center w-full absolute bottom-0 z-20">
    <TouchableOpacity
      onPress={onRewind}
      className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center border border-gray-700 shadow-sm"
    >
      <FontAwesome5 name="undo" size={16} color="#9CA3AF" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onDislike}
      className="w-16 h-16 rounded-full bg-red-500/10 items-center justify-center border-2 border-red-500/60 shadow-lg shadow-red-900/20"
    >
      <FontAwesome5 name="times" size={24} color="#F97373" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onLike}
      className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center border-2 border-emerald-500/60 shadow-lg shadow-emerald-900/20"
    >
      <FontAwesome5 name="heart" size={22} color="#34D399" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onList}
      className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center border border-gray-700 shadow-sm"
    >
      <FontAwesome5 name="th-large" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  </View>
);

// --- 4. COMPOSANT PRINCIPAL ---

export default function SwipePage() {
  // Utilisation de 'any' pour la ref car les types de la librairie sont incomplets
  const swiperRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- Gestionnaires d'événements ---
  const handleSwiped = useCallback((index: number) => {
    setCurrentIndex(index + 1);
  }, []);

  const handleSwipedLeft = useCallback((cardIndex: number) => {
    const movie = MOCK_MOVIES[cardIndex];
    if (movie) console.log("Dislike :", movie.title);
  }, []);

  const handleSwipedRight = useCallback((cardIndex: number) => {
    const movie = MOCK_MOVIES[cardIndex];
    if (movie) console.log("Like :", movie.title);
  }, []);

  // --- Actions déclenchées par les boutons ---
  const triggerSwipeLeft = () => swiperRef.current?.swipeLeft();
  const triggerSwipeRight = () => swiperRef.current?.swipeRight();
  
  const triggerRewind = () => {
    // swipeBack est disponible dans la librairie mais souvent non documenté en TS
    if (currentIndex > 0) {
      swiperRef.current?.swipeBack(() => {
        setCurrentIndex((prev) => prev - 1);
      });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* En-tête */}
      <Header />

      {/* Sous-titre */}
      <View className="px-6 mb-2 z-10">
        <Text className="text-gray-400 text-center text-xs opacity-70">
          Swipez à droite pour liker, à gauche pour passer
        </Text>
      </View>

      {/* Zone de Swipe */}
      {/* -mt-8 permet de remonter un peu les cartes sous le header */}
      <View className="flex-1 -mt-8 relative z-0">
        <Swiper
          ref={swiperRef}
          cards={MOCK_MOVIES}
          cardIndex={currentIndex}
          backgroundColor="transparent"
          stackSize={3}
          cardVerticalMargin={20}
          // Important: gérer le cas où movie est null
          renderCard={(movie: Movie) => {
             if (!movie) return <View className="flex-1 bg-transparent" />; 
             return <MovieCard movie={movie} />;
          }}
          onSwiped={handleSwiped}
          onSwipedLeft={handleSwipedLeft}
          onSwipedRight={handleSwipedRight}
          onSwipedAll={() => console.log("Fin de la liste")}
          // Configuration des labels visuels lors du swipe (LIKE / NOPE)
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: 'transparent',
                  borderColor: '#F97373',
                  color: '#F97373',
                  borderWidth: 4,
                  fontSize: 24,
                  fontWeight: '800',
                  borderRadius: 8,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 40,
                  marginLeft: -40,
                  elevation: 5,
                }
              }
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  backgroundColor: 'transparent',
                  borderColor: '#34D399',
                  color: '#34D399',
                  borderWidth: 4,
                  fontSize: 24,
                  fontWeight: '800',
                  borderRadius: 8,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 40,
                  marginLeft: 40,
                  elevation: 5,
                }
              }
            }
          }}
          animateCardOpacity
          swipeBackCard
        />
      </View>

      {/* Boutons de contrôle */}
      <ActionButtons
        onRewind={triggerRewind}
        onDislike={triggerSwipeLeft}
        onLike={triggerSwipeRight}
        onList={() => router.push("/")}
      />
    </View>
  );
}