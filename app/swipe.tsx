import React, { useRef, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Swiper from "react-native-deck-swiper";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";

// --- 1. TYPES & INTERFACES ---
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

// --- 2. CONSTANTES & DONNÉES ---
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

const Header = () => (
  <View className="px-6 pt-14 pb-4 flex-row justify-between items-center z-10">
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

const MovieCard = ({ movie }: { movie: Movie }) => {
  if (!movie) return null;

  return (
    <View className="w-[88%] h-[70%] bg-gray-900 rounded-3xl overflow-hidden shadow-lg border border-white/5">
      <Image
        source={{ uri: movie.poster }}
        className="w-full h-full absolute"
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.95)"]}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0 justify-end p-5"
      >
        <View className="flex-row items-center justify-between mb-2">
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
            <View className="flex-row items-center gap-1 bg-black/30 px-2 py-1 rounded-lg">
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

        {/* Genres Tags */}
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

interface ActionButtonsProps {
  onRewind: () => void;
  onDislike: () => void;
  onLike: () => void;
  onList: () => void;
}

const ActionButtons = ({ onRewind, onDislike, onLike, onList }: ActionButtonsProps) => (
  <View className="px-10 pb-10 flex-row justify-between items-center w-full">
    <TouchableOpacity
      onPress={onRewind}
      className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center border border-gray-700 shadow-sm"
    >
      <FontAwesome5 name="undo" size={16} color="#9CA3AF" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onDislike}
      className="w-16 h-16 rounded-full bg-red-500/10 items-center justify-center border-2 border-red-500/60 shadow-red-900/20 shadow-lg"
    >
      <FontAwesome5 name="times" size={24} color="#F97373" />
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onLike}
      className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center border-2 border-emerald-500/60 shadow-emerald-900/20 shadow-lg"
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
  const swiperRef = useRef<Swiper<Movie>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- Handlers ---
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

  // --- Button Actions ---
  const triggerSwipeLeft = () => swiperRef.current?.swipeLeft();
  const triggerSwipeRight = () => swiperRef.current?.swipeRight();
  const triggerRewind = () => {
    if (currentIndex > 0) {
      swiperRef.current?.jumpToCardIndex(currentIndex - 1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <Header />

      <View className="px-6 mb-2 z-10">
        <Text className="text-gray-400 text-center text-xs opacity-70">
          Swipez à droite pour liker, à gauche pour passer
        </Text>
      </View>

      <View className="flex-1 -mt-6">
        <Swiper
          ref={swiperRef}
          cards={MOCK_MOVIES}
          cardIndex={currentIndex}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={15}
          cardVerticalMargin={40}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: 'red',
                  borderColor: 'red',
                  color: 'white',
                  borderWidth: 1
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30
                }
              }
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  backgroundColor: '#34D399',
                  borderColor: '#34D399',
                  color: 'white',
                  borderWidth: 1
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30
                }
              }
            }
          }}
          animateCardOpacity
          infinite={false}
          onSwiped={handleSwiped}
          onSwipedLeft={handleSwipedLeft}
          onSwipedRight={handleSwipedRight}
          onSwipedAll={() => console.log("Fin de la liste")}
          renderCard={(movie) => <MovieCard movie={movie} />}
        />
      </View>

      <ActionButtons
        onRewind={triggerRewind}
        onDislike={triggerSwipeLeft}
        onLike={triggerSwipeRight}
        onList={() => router.push("/")}
      />
    </View>
  );
}