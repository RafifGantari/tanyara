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
          50: "#e8f0fe",
          100: "#d2e3fc",
          200: "#aecbfa",
          300: "#8ab4f8",
          400: "#669df6",
          500: "#1a73e8",
          600: "var(--primary)",
          700: "var(--primary-hover)",
          800: "var(--primary-active)",
          900: "#0d3b79",
          950: "#092752",
          foreground: "var(--primary-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
          border: "var(--danger-border)",
          ink: "var(--danger-ink)",
          hover: "var(--danger-hover)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
          border: "var(--warning-border)",
          ink: "var(--warning-ink)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
          border: "var(--success-border)",
          ink: "var(--success-ink)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
