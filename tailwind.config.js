/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Couleurs personnalisées
      colors: {
        primary: '#6C5CE7',      // Violet principal
        secondary: '#A29BFE',    // Violet clair
        dark: '#0F0F1E',         // FOND PRINCIPAL (Bleu nuit très sombre)
        darkCard: '#1A1A2E',     // Les cartes (Bleu un peu plus clair)
      }
    },
  },
  plugins: [],
}