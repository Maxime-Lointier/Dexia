import * as Localization from 'expo-localization';
import fr from "./fr";
import en from "./en";

export type Language = "fr" | "en";

const translations = { fr,en };

/**
On recup la langue du tel par défaut
 */
const deviceLanguage = Localization.getLocales()[0].languageCode;

/**
 * si tel en anglais, traduction anglais, si autre langue -> forcément trad francaise"
 */
let currentLanguage: Language = deviceLanguage === 'en' ? 'en' : 'fr';

let listeners: Array<(lang: Language) => void> = [];

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  listeners.forEach(callback => callback(lang));
};

export const subscribeLanguageChange = (callback: (lang: Language) => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const getCurrentLanguage = (): Language => currentLanguage;

export const t = (key: string): string => {
  const keys = key.split(".");
  let result: any = translations[currentLanguage];

  for (const k of keys) {
    result = result?.[k];
    if (!result) return key; 
  }

  return result;
};