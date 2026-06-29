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
        primary: {
          DEFAULT: "#3B6D11", // Primary green
          light: "#639922",   // Light green
        },
        background: "#F8F7F4", // Page bg
        surface: "#FFFFFF",    // Cards
        text: {
          primary: "#1A1A18",
          secondary: "#5F5E5A",
        },
        border: "rgba(0,0,0,0.08)",
        danger: "#E24B4A",
        warning: "#BA7517",
        success: "#1D9E75",
      },
      fontFamily: {
        bangla: ['"Hind Siliguri"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
