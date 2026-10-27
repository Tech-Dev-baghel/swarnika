import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wine: { 50: "#fbf3f4", 100: "#f3e1e4", 600: "#7a2a38", 700: "#5f1e2b", 800: "#4a1721", 900: "#33101a" },
        gold: { 100: "#f6ecd9", 200: "#ecd7ad", 400: "#cfa45a", 500: "#b8893b", 600: "#9a6f2a" },
        ivory: "#fbf7f1",
        ink: "#2a1d1f",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["Jost", "system-ui", "sans-serif"],
      },
      boxShadow: { soft: "0 10px 30px -12px rgba(74,23,33,.25)" },
    },
  },
  plugins: [],
} satisfies Config;
