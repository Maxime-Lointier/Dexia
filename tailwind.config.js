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
        dark: "#140E0C",
        darkCard: "#1E1A18",
        offWhite: "#F7F0FF",
      }
    },
  },
  plugins: [],
}