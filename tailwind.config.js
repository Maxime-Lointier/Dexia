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