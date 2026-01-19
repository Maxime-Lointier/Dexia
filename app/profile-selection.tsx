import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Dimensions, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useUser } from '../src/context/UserContext';
import { useTheme } from '../src/context/ThemeContext';
import { Logo } from '../src/components/Logo'; 
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 64) / 2;
const BIOMETRIC_KEY = 'SETTINGS_BIOMETRIC_ENABLED';

const ProfileSelection = () => {
    const { users, switchUser, refreshUsers } = useUser();
    const { colors, isDark } = useTheme();

    useFocusEffect(
        useCallback(() => {
            refreshUsers();
            console.log("🔄 ProfileSelection: Liste rechargée");
        }, [])
    );

    const handleProfileSelect = async (userId: number, isOnboardingDone: boolean) => {
        
        try {
            const isBiometricEnabled = await AsyncStorage.getItem(BIOMETRIC_KEY);

            if (isBiometricEnabled === 'true') {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Confirmez votre identité pour accéder au profil',
                    fallbackLabel: 'Utiliser le code PIN',
                    disableDeviceFallback: false,
                });

                if (!result.success) {
                    return; 
                }
            }

            await switchUser(userId);
            
            if (isOnboardingDone) {
                router.replace('/homeScreen');
            } else {
                router.replace('/onBoarding');
            }

        } catch (error) {
            console.error("Erreur authentification :", error);
            
            Alert.alert("Erreur", "Impossible de vérifier l'identité.");
        }
    };

    const handleCreateProfile = () => {
        router.push('/profile-create');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {}
                <View className="items-center pt-6 pb-10">
                    {}
                    <Logo width={60} height={60} /> 
                </View>

                <View className="flex-1 px-6">
                    <Text
                        className="text-2xl font-bold text-center mb-10 font-hanken"
                        style={{ color: colors.text }}
                    >
                        Qui swipe ?
                    </Text>

                    <View className="flex-row flex-wrap justify-center gap-6">
                        {users.map((user) => (
                            <TouchableOpacity
                                key={user.id}
                                activeOpacity={0.7}
                                onPress={() => handleProfileSelect(user.id, !!user.onboarding_done)}
                                className="items-center mb-6"
                                style={{ width: ITEM_SIZE }}
                            >
                                <View
                                    className="w-24 h-24 rounded-full items-center justify-center mb-3 shadow-lg"
                                    style={{
                                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C'][user.id % 5],
                                        shadowColor: isDark ? '#FFF' : '#000',
                                        shadowOpacity: 0.2,
                                        shadowRadius: 8,
                                        elevation: 5
                                    }}
                                >
                                    <Text className="text-4xl font-bold text-white font-hanken">
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </Text>
                                </View>
                                <Text
                                    className="text-lg font-medium text-center font-hanken"
                                    style={{ color: colors.text }}
                                    numberOfLines={1}
                                >
                                    {user.name}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleCreateProfile}
                            className="items-center mb-6"
                            style={{ width: ITEM_SIZE }}
                        >
                            <View
                                className="w-24 h-24 rounded-full items-center justify-center mb-3 border-2 border-dashed"
                                style={{ borderColor: colors.textSecondary }}
                            >
                                <Icon name="plus" size={32} color={colors.textSecondary} />
                            </View>
                            <Text
                                className="text-lg font-medium text-center font-hanken"
                                style={{ color: colors.textSecondary }}
                            >
                                Ajouter
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileSelection;