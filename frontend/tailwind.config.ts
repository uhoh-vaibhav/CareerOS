import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { navy: "#1F3864", accent: "#2E74B5", ice: "#DDEBF7", hilite: "#C55A11" },
    },
  },
  plugins: [],
};
export default config;
