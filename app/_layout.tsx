import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import './global.css';

SplashScreen.preventAutoHideAsync();

import { ThemeProvider } from '../src/context/ThemeContext';
import { UserProvider } from '../src/context/UserContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'HankenGrotesk': require('../assets/fonts/HankenGrotesk-VariableFont_wght.ttf'),
    'HankenGrotesk-Italic': require('../assets/fonts/HankenGrotesk-Italic-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}