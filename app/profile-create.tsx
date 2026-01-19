import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUser } from '../src/context/UserContext';
import { useTheme } from '../src/context/ThemeContext';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { t } from '../src/i18n';

const ProfileCreate = () => {
    const [name, setName] = useState('');
    const { addUser, users } = useUser();
    const { colors, isDark } = useTheme();
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;

        // Validation doublon (case insensitive)
        const normalizedName = name.trim().toLowerCase();
        const exists = users.some(u => u.name.toLowerCase() === normalizedName);

        if (exists) {
            Alert.alert(
                "Nom indisponible",
                "Ce nom de profil est déjà utilisé. Veuillez en choisir un autre."
            );
            return;
        }

        setLoading(true);
        try {
            await addUser(name.trim());
            // L'utilisateur est créé et switché automatiquement dans addUser context
            // On redirige vers l'onboarding pour qu'il choisisse ses genres
            router.replace('/onBoarding');
        } catch (error) {
            console.error('Erreur création profil:', error);
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, padding: 24, justifyContent: 'center' }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-6 z-10 p-2"
                >
                    <Icon name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>

                <View className="items-center mb-10">
                    <Text
                        className="text-3xl font-bold text-center mb-2 font-hanken"
                        style={{ color: colors.text }}
                    >
                        {t('createProfile.title')}
                    </Text>
                    <Text
                        className="text-base text-center font-hanken"
                        style={{ color: colors.textSecondary }}
                    >
                        {t('createProfile.subtitle')}
                    </Text>
                </View>

                <View className="items-center mb-8">
                    <View
                        className="w-28 h-28 rounded-full items-center justify-center mb-6 shadow-lg bg-gray-700"
                    >
                        <Icon name="user" size={40} color="#FFF" />
                    </View>
                </View>

                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('createProfile.placeholder')}
                    placeholderTextColor={colors.textSecondary}
                    className="w-full p-4 rounded-xl text-lg mb-8 font-hanken border"
                    style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: isDark ? '#333' : '#E5E5E5'
                    }}
                    autoFocus
                    maxLength={15}
                />

                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={!name.trim() || loading}
                    className={`w-full py-4 rounded-full items-center justify-center shadow-lg ${!name.trim() ? 'opacity-50' : ''}`}
                    style={{
                        backgroundColor: '#8A3AFF',
                        shadowColor: '#8A3AFF',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5
                    }}
                >
                    <Text className="text-white text-lg font-bold font-hanken">
                        {loading ? t('createProfile.creating') : t('createProfile.button')}
                    </Text>
                </TouchableOpacity>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ProfileCreate;
