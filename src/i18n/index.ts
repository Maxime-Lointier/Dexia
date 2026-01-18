import fr from "./fr";
import en from "./en";

export type Language = "fr" | "en";

const translations = {
  fr,
  en,
};

let currentLanguage: Language = "fr"; // fr par défaut

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const t = (key: string): string => {
  const keys = key.split(".");
  let result: any = translations[currentLanguage];

  for (const k of keys) {
    result = result?.[k];
    if (!result) return key;
  }

  return result;
};
