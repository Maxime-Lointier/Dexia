/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#8A3AFF",
        secondary: "#FF4FFD",
        tertiary: "#F7F0FF",

        // Couleurs dynamiques (Thème)
        background: "rgb(var(--background) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        textSecondary: "rgb(var(--text-secondary) / <alpha-value>)",

        // Anciennes refs pour compatibilité temporaire
        dark: "#0F0F1E",
        darkCard: "#1A1A2E",
        offWhite: "#F7F0FF",
      },
      fontFamily: {
        sans: ['HankenGrotesk', 'system-ui', 'sans-serif'],
        'hanken': ['HankenGrotesk'],
        'hanken-italic': ['HankenGrotesk-Italic'],
      }
    },
  },
  plugins: [],
}