import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0A1128",
        blueprint: "#5FD4F5",
        blueprintDim: "#2A6E8C",
        limestone: "#E8DCC8",
        amber: "#FFB454",
        inkline: "#9FB4C8",
        accent: "#FF6A3D",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        plot: ["var(--font-plot)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
