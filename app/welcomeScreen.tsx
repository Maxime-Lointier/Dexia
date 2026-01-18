import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { router } from 'expo-router';
import { Logo } from '../src/components/Logo';

const welcomeScreen = () => {
  const { isDark, colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'space-between' }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* PARTIE HAUTE : IMAGE / LOGO */}
      <View className="flex-1 items-center justify-center p-6">

        <View className="mb-10 items-center justify-center">
          <Logo width={220} height={220} />
        </View>

        <Text className="text-text text-4xl font-bold text-center mb-4 font-hanken tracking-tight">
          Dexia
        </Text>

        <Text className="text-[#FF4FFD] text-lg italic text-center mb-6 font-hanken-italic">
          The Right Swipe
        </Text>

        <Text className="text-textSecondary text-lg text-center leading-7 px-4 font-medium font-hanken">
          Découvre des films qui te correspondent vraiment en quelques swipes.
        </Text>
      </View>

      {/* Bouton */}
      <View className="p-6 pb-10">
        <TouchableOpacity
          onPress={() => router.push('/onBoarding')}
          activeOpacity={0.8}
          className="w-full bg-primary py-4 rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
            Commencer l'aventure
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default welcomeScreen;