import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#eff4f7",
          100: "#dfe8ed",
          200: "#bfd3df",
          300: "#9bb7cb",
          400: "#658ba7",
          500: "#3a607d",
          600: "var(--primary)",
          700: "var(--primary-hover)",
          800: "var(--primary-active)",
          900: "#000f1e",
          950: "#000912",
          foreground: "var(--primary-foreground)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
