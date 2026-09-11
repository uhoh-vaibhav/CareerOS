import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Modern SaaS mapping
        navy: "#0F172A",    // Slate 900
        "navy-light": "#1E293B", // Slate 800
        accent: "#4F46E5",  // Indigo 600
        "accent-hover": "#4338CA", // Indigo 700
        ice: "#F1F5F9",     // Slate 100
        hilite: "#7C3AED",  // Violet 600
        background: "#F8FAFC", // Slate 50
        surface: "#FFFFFF",
        "text-main": "#0F172A",
        "text-muted": "#64748B",
        border: "#E2E8F0"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
};
export default config;
