import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
    colors: typeof darkColors;
}

// Palette mode sombre
const darkColors = {
    background: '#0F0F1E',
    card: '#1A1A2E',
    text: '#F7F0FF',
    textSecondary: '#a1a1aa',
    border: '#2c2d3a',
    iconBg: '#232433',
};

// Palette mode clair
const lightColors = {
    background: '#FFFFFF',
    card: '#F4F4F5',
    text: '#0F0F1E',
    textSecondary: '#71717a',
    border: '#e4e4e7',
    iconBg: '#f4f4f5',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'DEXIA_THEME_PREFERENCE';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

    // Écouter les changements système
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemScheme(colorScheme);
        });
        return () => subscription.remove();
    }, []);

    // Charger la préférence sauvegardée
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                setThemeState(savedTheme as Theme);
            }
        } catch (error) {
            console.log('Erreur chargement thème:', error);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (error) {
            console.log('Erreur sauvegarde thème:', error);
        }
    };

    // Calculer si on est en mode sombre
    const isDark = theme === 'system'
        ? systemScheme === 'dark'
        : theme === 'dark';

    // Sélectionner la palette de couleurs
    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme doit être utilisé dans un ThemeProvider');
    }
    return context;
}
