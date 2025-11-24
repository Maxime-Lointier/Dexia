// app/swipe.tsx

import React, { useRef, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Swiper from "react-native-deck-swiper";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";

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

const movies: Movie[] = [
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

export default function SwipePage() {
  const swiperRef = useRef<Swiper<Movie>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwiped = (index: number) => {
    setCurrentIndex(index + 1);
  };

  const handleSwipedLeft = (cardIndex: number) => {
    const movie = movies[cardIndex];
    if (movie) {
      console.log("Dislike :", movie.title);
    }
  };

  const handleSwipedRight = (cardIndex: number) => {
    const movie = movies[cardIndex];
    if (movie) {
      console.log("Like :", movie.title);
    }
  };

  const handlePressDislike = () => {
    swiperRef.current?.swipeLeft();
  };

  const handlePressLike = () => {
    swiperRef.current?.swipeRight();
  };

  const handlePressRewind = () => {
    // Revenir à la carte précédente si dispo
    swiperRef.current?.jumpToCardIndex(
      currentIndex > 0 ? currentIndex - 1 : 0
    );
  };

  return (
    <View className="flex-1 bg-dark">
      <StatusBar style="light" />

      {/* HEADER */}
      <View className="px-6 pt-14 pb-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-darkCard rounded-full items-center justify-center"
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
          className="w-10 h-10 bg-darkCard rounded-full items-center justify-center"
        >
          <FontAwesome5 name="user" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* SOUS-TITRE */}
      <View className="px-6 mb-2">
        <Text className="text-gray-400 text-sm">
          Swipez à droite pour liker, à gauche pour passer.
        </Text>
      </View>

      {/* SWIPER */}
      <View className="flex-1 items-center justify-center">
        <Swiper
          ref={swiperRef}
          cards={movies}
          cardIndex={0}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={15}
          cardVerticalMargin={40}
          animateCardOpacity
          infinite={false}
          onSwiped={handleSwiped}
          onSwipedLeft={handleSwipedLeft}
          onSwipedRight={handleSwipedRight}
          onSwipedAll={() => console.log("Plus de films à swiper")}
          renderCard={(movie) => {
            if (!movie) return null;

            return (
              <View className="w-[88%] h-[70%] bg-darkCard rounded-3xl overflow-hidden shadow-lg border border-white/5">
                {/* Affiche */}
                <View className="flex-1">
                  <Image
                    source={{ uri: movie.poster }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.9)"]}
                    start={{ x: 0, y: 0.3 }}
                    end={{ x: 0, y: 1 }}
                    className="absolute inset-0 justify-end p-5"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1 pr-2">
                        <Text
                          className="text-white font-bold text-2xl"
                          numberOfLines={2}
                        >
                          {movie.title}
                        </Text>
                        <Text className="text-gray-300 text-xs mt-1">
                          {movie.year} • {movie.duration}
                        </Text>
                      </View>

                      <View className="items-end">
                        <View className="flex-row items-center gap-1">
                          <FontAwesome
                            name="star"
                            size={14}
                            color="#FACC15"
                          />
                          <Text className="text-white font-bold text-sm">
                            {movie.rating.toFixed(1)}
                          </Text>
                        </View>
                        <Text className="text-emerald-400 text-[10px] mt-1">
                          {movie.match}% match
                        </Text>
                      </View>
                    </View>

                    {/* Genres */}
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {movie.genres.map((g) => (
                        <View
                          key={g}
                          className="bg-white/10 px-2 py-1 rounded-md"
                        >
                          <Text className="text-white text-[10px] font-semibold">
                            {g}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </LinearGradient>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* BOUTONS DE CONTRÔLE (LIKE / DISLIKE) */}
      <View className="px-10 pb-8 flex-row justify-between items-center">
        {/* Rewind */}
        <TouchableOpacity
          onPress={handlePressRewind}
          className="w-14 h-14 rounded-full bg-darkCard items-center justify-center border border-gray-700"
        >
          <FontAwesome5 name="undo" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Dislike */}
        <TouchableOpacity
          onPress={handlePressDislike}
          className="w-16 h-16 rounded-full bg-red-500/10 items-center justify-center border border-red-500/60"
        >
          <FontAwesome5 name="times" size={22} color="#F97373" />
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity
          onPress={handlePressLike}
          className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center border border-emerald-500/60"
        >
          <FontAwesome5 name="heart" size={22} color="#34D399" />
        </TouchableOpacity>

        {/* Liste (placeholder pour plus tard) */}
        <TouchableOpacity
          onPress={() => router.push("/")}
          className="w-14 h-14 rounded-full bg-darkCard items-center justify-center border border-gray-700"
        >
          <FontAwesome5 name="th-large" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
