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
import { t } from '../src/i18n';

const COLORS = {
  background: '#0F0F1E',
  card: '#1A1A2E',
  textPrimary: '#F7F0FF',
  textSecondary: '#a1a1aa',
  accent: '#8A3AFF',
  iconBg: '#232433',
};


const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const SectionContainer = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.sectionContainer}>{children}</View>
);


const SettingItem = ({
  icon,
  label,
  subLabel,
  onPress,
  showChevron = true,
}: {
  icon: string;
  label: string;
  subLabel?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={20} color={COLORS.accent} />
      </View>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        {subLabel && <Text style={styles.rowSubLabel}>{subLabel}</Text>}
      </View>
    </View>
    {showChevron && (
      <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
    )}
  </TouchableOpacity>
);

const SettingSwitch = ({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={20} color={COLORS.accent} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Switch
      trackColor={{ false: '#3e3e3e', true: COLORS.accent }}
      thumbColor="#fff"
      value={value}
      onValueChange={onValueChange}
    />
  </View>
);

const SettingRadio = ({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        <Icon
          name={icon}
          size={20}
          color={selected ? COLORS.accent : COLORS.textSecondary}
        />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View
      style={[
        styles.radioOuter,
        selected && { borderColor: COLORS.accent },
      ]}
    >
      {selected && <View style={styles.radioInner} />}
    </View>
  </TouchableOpacity>
);


export default function Settings() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark');
  const [notifications, setNotifications] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Language */}
        <SectionTitle title={t('settings.language.section')} />
        <SectionContainer>
          <SettingItem
            icon="translate"
            label={t('settings.language.app')}
            subLabel="English"
          />
        </SectionContainer>

        {/* Theme */}
        <SectionTitle title={t('settings.theme.section')} />
        <SectionContainer>
          <SettingRadio
            icon="weather-night"
            label={t('settings.theme.dark')}
            selected={theme === 'dark'}
            onPress={() => setTheme('dark')}
          />
          <View style={styles.divider} />
          <SettingRadio
            icon="white-balance-sunny"
            label={t('settings.theme.light')}
            selected={theme === 'light'}
            onPress={() => setTheme('light')}
          />
          <View style={styles.divider} />
          <SettingRadio
            icon="theme-light-dark"
            label={t('settings.theme.auto')}
            selected={theme === 'auto'}
            onPress={() => setTheme('auto')}
          />
        </SectionContainer>

        {/* Preferences */}
        <SectionTitle title={t('settings.preferences.section')} />
        <SectionContainer>
          <SettingItem
            icon="view-grid-outline"
            label={t('settings.preferences.genres')}
          />
          <View style={styles.divider} />
          <SettingSwitch
            icon="bell-outline"
            label={t('settings.preferences.notifications')}
            value={notifications}
            onValueChange={setNotifications}
          />
        </SectionContainer>

        {/* Account */}
        <SectionTitle title={t('settings.account.section')} />
        <SectionContainer>
          <SettingItem
            icon="account"
            label={t('settings.account.profile')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="lock"
            label={t('settings.account.privacy')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-check"
            label={t('settings.account.security')}
          />
        </SectionContainer>

        {/* About */}
        <SectionTitle title={t('settings.about.section')} />
        <SectionContainer>
          <SettingItem
            icon="help-circle-outline"
            label={t('settings.about.help')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="file-document-outline"
            label={t('settings.about.terms')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="information-outline"
            label={t('settings.about.version')}
            subLabel="2.1.4"
            showChevron={false}
          />
        </SectionContainer>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


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
    paddingBottom: 24,
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
