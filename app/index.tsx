import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native'; // J'ai ajouté Text pour le debug
import { Redirect } from 'expo-router';
import { userExists, isOnboardingDone, setOnboardingDone, CURRENT_USER_ID } from '../src/models/user'; 

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldGoToHome, setShouldGoToHome] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      console.log("🔍 Vérification du statut utilisateur...");
      
      // --- LIGNE MAGIQUE POUR TESTER (A supprimer plus tard) ---
      // Force l'onboarding à "non fait" à chaque lancement pour tes tests
      console.log("🛠️ DEBUG: Réinitialisation de l'onboarding pour test");
      await setOnboardingDone(CURRENT_USER_ID, false); 
      // -------------------------------------------------------

      const exists = await userExists();
      const onboardingFinished = await isOnboardingDone(CURRENT_USER_ID);

      console.log(`👤 Utilisateur existe ? ${exists}`);
      console.log(`✅ Onboarding fini ? ${onboardingFinished}`);

      if (exists && onboardingFinished) {
        setShouldGoToHome(true);
      } else {
        setShouldGoToHome(false);
      }
    } catch (error) {
      console.error("❌ Erreur checkUserStatus:", error);
      setShouldGoToHome(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1E' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{color:'white', marginTop: 10}}>Chargement...</Text>
      </View>
    );
  }

  // Redirection
  return shouldGoToHome ? <Redirect href="/homeScreen" /> : <Redirect href="/welcomeScreen" />;
}