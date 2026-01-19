import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { clearUserHistory, deleteUser, getAllUsers } from '../src/models/user';

const Privacy = () => {
  const { colors, isDark } = useTheme();
  const { currentUser, logout, refreshUsers } = useUser();

  // --- ACTIONS ---

  // 1. Effacer l'historique (Likes, Dislikes, Poids des genres)
  const handleClearHistory = () => {
    Alert.alert(
      "Effacer l'historique ?",
      "Cela supprimera tous vos likes, films vus et réinitialisera l'apprentissage de l'algorithme. Vos listes manuelles resteront.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer",
          style: "destructive",
          onPress: async () => {
            if (currentUser) {
              const success = await clearUserHistory(currentUser.id);
              if (success) {
                Alert.alert("Succès", "Votre historique a été remis à zéro.");
              } else {
                Alert.alert("Erreur", "Impossible d'effacer l'historique.");
              }
            }
          }
        }
      ]
    );
  };

  // 2. Supprimer le compte (Irréversible)
  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le profil ?",
      "Attention, cette action est irréversible. Toutes vos données seront perdues définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (currentUser) {
              const success = await deleteUser(currentUser.id);
              if (success) {
                const remainingUsers = await getAllUsers();
                logout();

                if (remainingUsers.length === 0) {
                  router.replace('/welcomeScreen');
                } else {
                  await refreshUsers();
                  router.replace('/profile-selection');
                }
              } else {
                Alert.alert("Erreur", "Impossible de supprimer le profil.");
              }
            }
          }
        }
      ]
    );
  };

  // --- COMPOSANTS UI ---

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 12, paddingHorizontal: 4 }}>
      {title}
    </Text>
  );

  const SectionContainer = ({ children }: { children: React.ReactNode }) => (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
      {children}
    </View>
  );

  const SettingItem = ({ icon, label, subLabel, onPress, isDestructive = false }: any) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.iconBox, { backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.15)' : colors.iconBg }]}>
          <Icon name={icon} size={20} color={isDestructive ? '#ef4444' : '#8A3AFF'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: isDestructive ? '#ef4444' : colors.text, fontWeight: '500' }}>{label}</Text>
          {subLabel && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{subLabel}</Text>}
        </View>
      </View>
      <Icon name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>

        {/* INFO DATA LOCAL */}
        <View style={[styles.infoBox, { backgroundColor: 'rgba(138, 58, 255, 0.1)', borderColor: 'rgba(138, 58, 255, 0.3)' }]}>
          <Icon name="shield-check-outline" size={24} color="#8A3AFF" style={{ marginRight: 12 }} />
          <Text style={{ color: colors.text, flex: 1, fontSize: 14, lineHeight: 20 }}>
            Vos données sont stockées localement sur votre appareil. Nous ne partageons vos préférences avec aucun tiers.
          </Text>
        </View>

        {/* SECTION DONNÉES */}
        <SectionTitle title="Mes données" />
        <SectionContainer>
          <SettingItem
            icon="history"
            label="Effacer l'historique"
            subLabel="Réinitialiser l'algorithme de recommandations"
            onPress={handleClearHistory}
          />
        </SectionContainer>

        {/* SECTION DANGER */}
        <SectionTitle title="Zone de danger" />
        <SectionContainer>
          <SettingItem
            icon="delete-outline"
            label="Supprimer mon profil"
            subLabel="Cette action est irréversible"
            onPress={handleDeleteAccount}
            isDestructive={true}
          />
        </SectionContainer>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  }
});

export default Privacy;