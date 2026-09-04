/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#0F766E",
          light: "#CCFBF1",
        },
        ayur: {
          DEFAULT: "#3F7D58",
        },
        bg: {
          DEFAULT: "#F7FAF8",
        },
        ink: {
          DEFAULT: "#16302B",
          soft: "#64748B",
        },
        warn: "#D97706",
        emergency: "#DC2626",
        success: "#16A34A",
        saffron: "#D4A72C",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        devanagari: ["Noto Sans Devanagari", "Noto Sans", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(15, 118, 110, 0.08)",
        card: "0 1px 3px rgba(22, 48, 43, 0.06), 0 4px 16px rgba(22, 48, 43, 0.04)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
        rise: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
        rise: "rise 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
