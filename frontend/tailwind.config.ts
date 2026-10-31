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
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bcdefe",
          300: "#8ec8fc",
          400: "#59a7f8",
          500: "#3285f1",
          600: "#1e67e5",
          700: "#1851d2",
          800: "#1a42aa",
          900: "#1a3a86",
          950: "#152552",
        },
      },
    },
  },
  plugins: [],
};

export default config;
