import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        background: "var(--background)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        primarybtn: "var(--btn-primary)",
        secondarybtn: "var(--btn-secondary)",
      },
      textColor: {
        title: "var(--title)",
        subtitle: "var(--subtitle)",
        foreground: "var(--foreground)",
        btnptext: "var(--text-btn-primary)",
        btnstext: "var(--text-btn-secondary)",
      },
    },
  },
  plugins: [],
};

export default config;
