/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Neutros oscuros con más profundidad y un punto cálido (menos "gris plano")
        base: "#0a0d12",
        panel: "#151a22",
        panel2: "#1e242e",
        line: "#232b36",
        ink: "#eef2f7",
        mut: "#8f9bab",
        accent: "#e63946",   // rojo espartano
        accent2: "#c42a37",  // rojo presionado / profundo
        ok: "#31c96f",
        warn: "#f0a500",
      },
      fontFamily: {
        sans: ["Barlow", "system-ui", "sans-serif"],
        cond: ["'Barlow Semi Condensed'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 1px rgba(0,0,0,.35), 0 10px 30px -18px rgba(0,0,0,.7)",
        sheet: "0 -10px 50px rgba(0,0,0,.55)",
        fab: "0 10px 26px -8px rgba(230,57,70,.55)",
      },
      keyframes: {
        sheetUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(.94)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "sheet-up": "sheetUp .30s cubic-bezier(.16,1,.3,1)",
        "fade-in": "fadeIn .25s ease",
        "fade-up": "fadeUp .35s cubic-bezier(.16,1,.3,1)",
        pop: "pop .18s cubic-bezier(.16,1,.3,1)",
      },
    },
  },
  plugins: [],
};