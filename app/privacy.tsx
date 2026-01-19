import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { clearUserHistory, deleteUser, getAllUsers } from '../src/models/user';
import { t } from '../src/i18n';

const Privacy = () => {
  const { colors, isDark } = useTheme();
  const { currentUser, logout, refreshUsers } = useUser();

  const handleClearHistory = () => {
    Alert.alert(
      t('privacy.clearAlertTitle'),
      t('privacy.clearAlertMsg'),
      [
        {text: t('privacy.cancel'), style: "cancel" },
        {
          text: t('privacy.confirmClear'),
          style: "destructive",
          onPress: async () => {
            if (currentUser) {
              const success = await clearUserHistory(currentUser.id);
              if (success) {
                Alert.alert(t('privacy.successTitle'), t('privacy.successMsg'));
              } else {
                Alert.alert(t('privacy.errorTitle'), t('privacy.errorClear'));
              }
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('privacy.deleteAlertTitle'),
      t('privacy.deleteAlertMsg'),
      [
        { text: t('privacy.cancel'), style: "cancel" },
        {
          text: t('privacy.confirmDelete'),
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
                Alert.alert(t('privacy.errorTitle'), t('privacy.errorDelete'));
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('privacy.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>

        {}
        <SectionTitle title={t('privacy.myData')} />
        <SectionContainer>
          <SettingItem
            icon="history"
            label={t('privacy.clearHistory')}
            subLabel={t('privacy.clearHistorySub')}
            onPress={handleClearHistory}
          />
        </SectionContainer>

        {}
        <SectionTitle title={t('privacy.dangerZone')} />
        <SectionContainer>
          <SettingItem
            icon="delete-outline"
            label={t('privacy.deleteProfile')}
            subLabel={t('privacy.deleteProfileSub')}
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