import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useUser } from '../src/context/UserContext';
import { useTheme } from '../src/context/ThemeContext';

export default function Index() {
  const { currentUser, users, isLoading } = useUser();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        // Si user déjà chargé (auto-login), on check l'onboarding
        if (currentUser.onboarding_done) {
          router.replace('/homeScreen');
        } else {
          router.replace('/onBoarding');
        }
      } else {
        // Pas de user actif
        if (users.length === 0) {
          // Premier lancement absolu
          router.replace('/welcomeScreen');
        } else {
          // Des profils existent, on choisit
          router.replace('/profile-selection');
        }
      }
    }
  }, [currentUser, isLoading, users]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color="#8A3AFF" />
      <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Démarrage...</Text>
    </View>
  );
}