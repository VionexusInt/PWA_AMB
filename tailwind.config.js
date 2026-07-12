/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0d1117",
        panel: "#161b22",
        panel2: "#1c2330",
        line: "#2a3038",
        ink: "#e6edf3",
        mut: "#8b98a5",
        accent: "#e63946",   // rojo ambulancia
        ok: "#2ecc71",
        warn: "#f0a500",
      },
      fontFamily: {
        sans: ["Barlow", "system-ui", "sans-serif"],
        cond: ["'Barlow Semi Condensed'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
