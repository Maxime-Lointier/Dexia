import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
  background: '#0e0f19', 
  card: '#181926',
  textPrimary: '#FFFFFF',
  textSecondary: '#a1a1aa',
  accent: '#4f46e5',
  iconBg: '#232433', 
};


const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const SectionContainer = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.sectionContainer}>{children}</View>
);


const SettingItem = ({ icon, label, subLabel, onPress, showChevron = true }: any) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={20} color={COLORS.accent} />
      </View>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {subLabel && <Text style={styles.rowSubLabel}>{subLabel}</Text>}
      </View>
    </View>
    {showChevron && <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />}
  </TouchableOpacity>
);


const SettingSwitch = ({ icon, label, value, onValueChange }: any) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={20} color={COLORS.accent} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Switch
      trackColor={{ false: '#3e3e3e', true: COLORS.accent }}
      thumbColor={'#fff'}
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const SettingRadio = ({ icon, label, selected, onPress }: any) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={20} color={selected ? COLORS.accent : COLORS.textSecondary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={[styles.radioOuter, selected && { borderColor: COLORS.accent }]}>
        {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);


const Settings = () => {
  const [theme, setTheme] = useState('sombre');
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('..')} style={styles.backButton}> // bouton retour
           <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
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
            selected={theme === 'sombre'} 
            onPress={() => setTheme('sombre')}
          />
          <View style={styles.divider} />
          <SettingRadio 
            icon="white-balance-sunny" 
            label="Mode clair" 
            selected={theme === 'clair'} 
            onPress={() => setTheme('clair')}
          />
           <View style={styles.divider} />
          <SettingRadio 
            icon="theme-light-dark" 
            label="Automatique" 
            selected={theme === 'auto'} 
            onPress={() => setTheme('auto')}
          />
        </SectionContainer>

        <SectionTitle title="Préférences" />
        <SectionContainer>
            <SettingItem icon="view-grid-outline" label="Genres préférés" />
            <View style={styles.divider} />
            <SettingSwitch 
                icon="bell-outline" 
                label="Notifications" 
                value={notifications}
                onValueChange={setNotifications}
            />
            <View style={styles.divider} />
            <SettingSwitch 
                icon="play-circle-outline" 
                label="Lecture automatique" 
                value={autoPlay}
                onValueChange={setAutoPlay}
            />
        </SectionContainer>

        <SectionTitle title="Compte" />
        <SectionContainer>
            <SettingItem icon="account" label="Profil" />
            <View style={styles.divider} />
            <SettingItem icon="lock" label="Confidentialité" />
            <View style={styles.divider} />
            <SettingItem icon="shield-check" label="Sécurité" />
        </SectionContainer>

        <SectionTitle title="À propos" />
        <SectionContainer>
            <SettingItem icon="help-circle-outline" label="Aide & Support" />
            <View style={styles.divider} />
            <SettingItem icon="file-document-outline" label="Conditions d'utilisation" />
            <View style={styles.divider} />
            <SettingItem 
                icon="information-outline" 
                label="Version" 
                subLabel="2.1.4" 
                showChevron={false} 
            />
        </SectionContainer>
        
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  rowSubLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#2c2d3a',
    marginLeft: 64,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
});

export default Settings;