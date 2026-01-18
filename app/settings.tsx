import React, { useState } from 'react';
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

const Settings = () => {
  const { theme, setTheme, isDark, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);

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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>

        <SectionTitle title="Langue" />
        <SectionContainer>
          <SettingItem
            icon="translate"
            label="Langue de l'application"
            subLabel="Français"
          />
        </SectionContainer>

        <SectionTitle title="Thème" />
        <SectionContainer>
          <SettingRadio
            icon="weather-night"
            label="Mode sombre"
            selected={theme === 'dark'}
            onPress={() => setTheme('dark')}
          />
          <Divider />
          <SettingRadio
            icon="white-balance-sunny"
            label="Mode clair"
            selected={theme === 'light'}
            onPress={() => setTheme('light')}
          />
          <Divider />
          <SettingRadio
            icon="theme-light-dark"
            label="Automatique"
            selected={theme === 'system'}
            onPress={() => setTheme('system')}
          />
        </SectionContainer>

        <SectionTitle title="Préférences" />
        <SectionContainer>
          <SettingItem icon="view-grid-outline" label="Genres préférés" />
          <Divider />
          <SettingSwitch
            icon="bell-outline"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
        </SectionContainer>

        <SectionTitle title="Compte" />
        <SectionContainer>
          <SettingItem icon="account" label="Profil" />
          <Divider />
          <SettingItem icon="lock" label="Confidentialité" />
          <Divider />
          <SettingItem icon="shield-check" label="Sécurité" />
        </SectionContainer>

        <SectionTitle title="À propos" />
        <SectionContainer>
          <SettingItem icon="help-circle-outline" label="Aide & Support" />
          <Divider />
          <SettingItem icon="file-document-outline" label="Conditions d'utilisation" />
          <Divider />
          <SettingItem
            icon="information-outline"
            label="Version"
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