import fr from "./fr";
import en from "./en";

export type Language = "fr" | "en";

const translations = { fr, en };
let currentLanguage: Language = "en";
let listeners: Array<(lang: Language) => void> = []; // Pour notifier les composants

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  listeners.forEach(l => l(lang)); // On prévient tout le monde
};

export const subscribeLanguageChange = (callback: (lang: Language) => void) => {
  listeners.push(callback);
  return () => { listeners = listeners.filter(l => l !== callback); };
};

export const getCurrentLanguage = () => currentLanguage;

export const t = (key: string): string => {
  const keys = key.split(".");
  let result: any = translations[currentLanguage];
  for (const k of keys) {
    result = result?.[k];
    if (!result) return key;
  }
  return result;
};