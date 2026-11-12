import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        deep: "var(--bg-deep)",
        mid: "var(--bg-mid)",
        cyan: "var(--ice-cyan)",
        "ice-light": "var(--ice-light)",
        lucuma: "var(--accent-lucuma)",
        fresa: "var(--accent-fresa)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-poppins)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
