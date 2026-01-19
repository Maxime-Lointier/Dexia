import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';
import { t, setLanguage, getCurrentLanguage, subscribeLanguageChange } from '../src/i18n';
import { updateUserLanguage, CURRENT_USER_ID } from '../src/models/user';

import { useUser } from '../src/context/UserContext';

const Settings = () => {
  const { theme, setTheme, isDark, colors } = useTheme();
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState(true);
  const [locale, setLocale] = useState(getCurrentLanguage());
  useEffect(() => {
    const unsubscribe = subscribeLanguageChange((newLang) => {
      setLocale(newLang);
    });
    return () => unsubscribe();
  }, []);

  // basculer fr et en
  const toggleLanguage = async () => {
    const newLang = locale === 'fr' ? 'en' : 'fr';
    setLanguage(newLang);
    if (currentUser) {
      await updateUserLanguage(currentUser.id, newLang);
    }
  };

  // Composants avec styles dynamiques
  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, paddingHorizontal: 4 }}>
      {title}
    </Text>
  );

  const SectionContainer = ({ children }: { children: React.ReactNode }) => (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
      {children}
    </View>
  );

  const SettingItem = ({ icon, label, subLabel, onPress, showChevron = true }: any) => (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Icon name={icon} size={20} color="#8A3AFF" />
        </View>
        <View>
          <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{label}</Text>
          {subLabel && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{subLabel}</Text>}
        </View>
      </View>
      {showChevron && <Icon name="chevron-right" size={24} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  const SettingSwitch = ({ icon, label, value, onValueChange }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Icon name={icon} size={20} color="#8A3AFF" />
        </View>
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{label}</Text>
      </View>
      <Switch
        trackColor={{ false: '#3e3e3e', true: '#8A3AFF' }}
        thumbColor={'#fff'}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  const SettingRadio = ({ icon, label, selected, onPress }: any) => (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Icon name={icon} size={20} color={selected ? '#8A3AFF' : colors.textSecondary} />
        </View>
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{label}</Text>
      </View>
      <View style={{
        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
        borderColor: selected ? '#8A3AFF' : colors.textSecondary,
        alignItems: 'center', justifyContent: 'center'
      }}>
        {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#8A3AFF' }} />}
      </View>
    </TouchableOpacity>
  );

  const Divider = () => <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 64 }} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
          {t('settings.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>

        {/* SECTION LANGUE */}
        <SectionTitle title={t('settings.language.sectionTitle')} />
        <SectionContainer>
          <SettingItem
            icon="translate"
            label={t('settings.language.appLanguage')}
            subLabel={t('settings.language.current')}
            onPress={toggleLanguage}
          />
        </SectionContainer>

        {/* SECTION THÈME */}
        <SectionTitle title={t('settings.theme.sectionTitle')} />
        <SectionContainer>
          <SettingRadio
            icon="weather-night"
            label={t('settings.theme.dark')}
            selected={theme === 'dark'}
            onPress={() => setTheme('dark')}
          />
          <Divider />
          <SettingRadio
            icon="white-balance-sunny"
            label={t('settings.theme.light')}
            selected={theme === 'light'}
            onPress={() => setTheme('light')}
          />
          <Divider />
          <SettingRadio
            icon="theme-light-dark"
            label={t('settings.theme.auto')}
            selected={theme === 'system'}
            onPress={() => setTheme('system')}
          />
        </SectionContainer>

        {/* SECTION PRÉFÉRENCES */}
        <SectionTitle title={t('settings.preferences.sectionTitle')} />
        <SectionContainer>
          <SettingItem icon="view-grid-outline" label={t('settings.preferences.favoriteGenres')} />
          <Divider />
          <SettingSwitch
            icon="bell-outline"
            label={t('settings.preferences.notifications')}
            value={notifications}
            onValueChange={setNotifications}
          />
        </SectionContainer>

        {/* SECTION COMPTE */}
        <SectionTitle title={t('settings.account.sectionTitle')} />
        <SectionContainer>
          <SettingItem
            icon="account"
            label={currentUser?.name || t('settings.account.profile')}
            subLabel= {t('settings.account.manageProfile')}
            onPress={() => {/* TODO: Edit profile name? */ }}
          />
          <Divider />
          <SettingItem
            icon="account-switch"
            label={t('settings.account.switchProfile')}
            subLabel={t('settings.account.useOtherAccount')}
            onPress={() => router.push('/profile-selection')}
          />
          <Divider />
          <SettingItem icon="lock" label={t('settings.account.privacy')} />
          <Divider />
          <SettingItem icon="shield-check" label={t('settings.account.security')} />
        </SectionContainer>

        {/* SECTION À PROPOS */}
        <SectionTitle title={t('settings.about.sectionTitle')} />
        <SectionContainer>
          <SettingItem icon="help-circle-outline" label={t('settings.about.help')} />
          <Divider />
          <SettingItem icon="file-document-outline" label={t('settings.about.terms')} />
          <Divider />
          <SettingItem
            icon="information-outline"
            label={t('settings.about.version')}
            subLabel="2.2.0"
            showChevron={false}
          />
        </SectionContainer>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;