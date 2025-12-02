import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { userExists } from '../src/models/user';

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndRedirect();
  }, []);

  const checkUserAndRedirect = async () => {
    try {
      // Vérifier si le profil utilisateur existe
      const exists = await userExists();

      if (exists) {
        // L'utilisateur existe, rediriger vers homeScreen
        router.replace('/homeScreen');
      } else {
        // L'utilisateur n'existe pas, rediriger vers welcomeScreen
        router.replace('/welcomeScreen');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      // En cas d'erreur, rediriger vers welcomeScreen par défaut
      router.replace('/welcomeScreen');
    } finally {
      setLoading(false);
    }
  };

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1E' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  // Ce return ne devrait jamais être atteint car la redirection se fait dans useEffect
  return null;
}