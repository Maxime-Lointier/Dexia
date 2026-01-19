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
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';
import { t, setLanguage, getCurrentLanguage, subscribeLanguageChange } from '../src/i18n';
import { updateUserLanguage,updateUserName } from '../src/models/user';
import { useUser } from '../src/context/UserContext';

// Liste des langues disponibles
const AVAILABLE_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const Settings = () => {
  const { theme, setTheme, isDark, colors } = useTheme();
  const { currentUser, setCurrentUser, refreshUsers } = useUser(); // Assure-toi que setCurrentUser est dispo dans ton contexte

  // --- États ---
  const [notifications, setNotifications] = useState(true);
  const [locale, setLocale] = useState(getCurrentLanguage());
  
  // Modals
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  
  // Input pour le nom
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeLanguageChange((newLang) => {
      setLocale(newLang);
    });
    return () => unsubscribe();
  }, []);

  // --- Logique Langue ---
  const handleLanguageSelect = async (langCode: string) => {
    setLanguage(langCode as any);
    if (currentUser) {
      await updateUserLanguage(currentUser.id, langCode as any);
    }
    setLanguageModalVisible(false);
  };

  // --- Logique Nom de Profil ---
  const openNameEditor = () => {
    if (currentUser) {
      setTempName(currentUser.name); // Pré-remplir avec le nom actuel
      setNameModalVisible(true);
    }
  };

  const saveName = async () => {
    if (tempName.trim().length === 0) return;

    if (currentUser) {
        // 1. D'ABORD : On écrit dans le disque dur (BDD)
        const success = await updateUserName(currentUser.id, tempName);
        
        if (success) {
            console.log("Sauvegarde BDD ok, mise à jour context...");
            
            // 2. ENSUITE : On met à jour l'affichage local
            setCurrentUser({ ...currentUser, name: tempName });

            // 3. ENFIN : On dit à toute l'appli de relire la BDD
            // C'est ça qui va mettre à jour la page "Changer de profil"
            await refreshUsers(); 
            
            setNameModalVisible(false);
        } else {
            alert("Erreur lors de la sauvegarde");
        }
    }
};

  // --- Composants UI Helper ---

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

  // --- Rendu Principal ---

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

        {/* ... AUTRES SECTIONS ... */}

        {/* SECTION LANGUE */}
        <SectionTitle title={t('settings.language.sectionTitle')} />
        <SectionContainer>
          <SettingItem
            icon="translate"
            label={t('settings.language.appLanguage')}
            subLabel={AVAILABLE_LANGUAGES.find(l => l.code === locale)?.label || locale}
            onPress={() => setLanguageModalVisible(true)}
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

        {/* SECTION COMPTE (MODIFIÉE) */}
        <SectionTitle title={t('settings.account.sectionTitle')} />
        <SectionContainer>
          {/* Item 1: Profil (Cliquer ici ouvre le modal) */}
          <SettingItem
            icon="account"
            label={currentUser?.name || t('settings.account.profile')}
            subLabel="Gérer mon profil"
            onPress={openNameEditor} 
          />
          <Divider />
          <SettingItem
            icon="account-switch"
            label="Changer de profil"
            subLabel="Utiliser un autre compte"
            onPress={() => router.push('/profile-selection')}
          />
          <Divider />
          <SettingItem icon="lock" label={t('settings.account.privacy')} onPress={() => router.push('/privacy')} />
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

      {/* --- MODAL DE SÉLECTION DE LANGUE --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                <View style={styles.dragIndicator} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('settings.language.select')}
                </Text>
                {AVAILABLE_LANGUAGES.map((lang, index) => (
                  <View key={lang.code}>
                    <TouchableOpacity
                      style={styles.languageOption}
                      onPress={() => handleLanguageSelect(lang.code)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{lang.flag}</Text>
                        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
                          {lang.label}
                        </Text>
                      </View>
                      {locale === lang.code && (
                        <View style={styles.checkCircle}>
                           <Icon name="check" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {index < AVAILABLE_LANGUAGES.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 50 }} />
                    )}
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- NOUVEAU : MODAL EDITER PROFIL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={nameModalVisible}
        onRequestClose={() => setNameModalVisible(false)}
      >
        {/* KeyboardAvoidingView permet de remonter le modal quand le clavier sort */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setNameModalVisible(false)}>
            <View style={{flex: 1, justifyContent: 'flex-end'}}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.dragIndicator} />
                    
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Modifier mon profil</Text>
                    
                    <Text style={{color: colors.textSecondary, marginBottom: 8, fontSize: 14}}>
                        Nom d'utilisateur
                    </Text>

                    {/* Champ de texte */}
                    <TextInput 
                        style={[styles.input, { 
                            color: colors.text, 
                            backgroundColor: isDark ? '#232433' : '#f3f4f6',
                            borderColor: isDark ? '#333' : '#ddd'
                        }]}
                        value={tempName}
                        onChangeText={setTempName}
                        placeholder="Entrez votre nom"
                        placeholderTextColor={colors.textSecondary}
                        autoFocus={true}
                    />

                    {/* Boutons d'action */}
                    <View style={{flexDirection: 'row', gap: 12, marginTop: 24}}>
                         <TouchableOpacity 
                            style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border, flex: 1 }]} 
                            onPress={() => setNameModalVisible(false)}
                        >
                            <Text style={{ color: colors.text, fontWeight: '600' }}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.button, { backgroundColor: '#8A3AFF', flex: 1 }]} 
                            onPress={saveName}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Enregistrer</Text>
                        </TouchableOpacity>
                    </View>

                  </View>
                </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8A3AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Nouveaux styles pour l'input et boutons
  input: {
      height: 50,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
  },
  button: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center'
  }
});

export default Settings;