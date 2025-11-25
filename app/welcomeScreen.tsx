import React from 'react';
import {View, Text, TouchableOpacity, StatusBar} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons'; 
import { router } from 'expo-router';

const welcomeScreen = () => {

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F1E] justify-between">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1E" />
      
      {/* PARTIE HAUTE : IMAGE / LOGO */}
      <View className="flex-1 items-center justify-center p-6">
        
        {/* Un cercle décoratif pour le logo mais à remplacer avec le futur logo */}
        <View className="w-48 h-48 bg-[#1A1A2E] rounded-full items-center justify-center mb-10 border border-white/5 shadow-lg shadow-[#6C5CE7]/20">
            <Icon name="film" size={80} color="#6C5CE7" />
        </View>

        <Text className="text-white text-4xl font-bold text-center mb-4">
          Dexia
        </Text>

        <Text className="text-gray-400 text-lg text-center leading-6 px-4">
          Découvrez des films qui vous correspondent vraiment. Dites-nous ce que vous aimez, on s'occupe du reste.
        </Text>
      </View>

      {/* PARTIE BASSE : BOUTON */}
      <View className="p-6 pb-10">
        <TouchableOpacity
            onPress={() => router.push('/onBoarding')} // On va vers la sélection des genres
            activeOpacity={0.8}
            className="w-full bg-[#6C5CE7] py-4 rounded-full items-center justify-center"
        >
            <Text className="text-white text-lg font-bold">
                Commencer l'aventure
            </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default welcomeScreen;