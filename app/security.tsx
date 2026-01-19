import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';

export const BIOMETRIC_KEY = 'SETTINGS_BIOMETRIC_ENABLED';

const Security = () => {
  const { colors, isDark } = useTheme();
  
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkHardware();
    loadSettings();
  }, []);

  const checkHardware = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  };

  const loadSettings = async () => {
    const bioState = await AsyncStorage.getItem(BIOMETRIC_KEY);
    setBiometricEnabled(bioState === 'true');
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmer pour activer la sécurité',
      });

      if (result.success) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem(BIOMETRIC_KEY, 'true');
      } else {
        setBiometricEnabled(false);
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem(BIOMETRIC_KEY, 'false');
    }
  };


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

  const SettingSwitch = ({ icon, label, subLabel, value, onValueChange, disabled = false }: any) => (
    <View style={styles.itemRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, opacity: disabled ? 0.5 : 1 }}>
        <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
          <Icon name={icon} size={20} color="#8A3AFF" />
        </View>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{label}</Text>
          {subLabel && <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{subLabel}</Text>}
        </View>
      </View>
      <Switch
        trackColor={{ false: '#3e3e3e', true: '#8A3AFF' }}
        thumbColor={'#fff'}
        onValueChange={onValueChange}
        value={value}
        disabled={disabled}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sécurité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        
        {}
        <View style={[styles.infoBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
            <Icon name="lock-check-outline" size={24} color="#3b82f6" style={{marginRight: 12}} />
            <Text style={{color: colors.text, flex: 1, fontSize: 14, lineHeight: 20}}>
                Activez la protection biométrique pour empêcher l'accès non autorisé à l'application.
            </Text>
        </View>

        <SectionTitle title="Verrouillage" />
        <SectionContainer>
          <SettingSwitch
            icon="face-recognition"
            label="Verrouillage biométrique"
            subLabel={isBiometricSupported ? "FaceID / TouchID requis au lancement" : "Non disponible sur cet appareil"}
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            disabled={!isBiometricSupported}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
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

export default Security;