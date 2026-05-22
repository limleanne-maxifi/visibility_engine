import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          navy:           "var(--navy-header)",
          "navy-sub":     "var(--navy-sub)",
          gold:           "var(--gold)",
          "gold-hover":   "var(--gold-hover)",
          "gold-pale":    "var(--gold-pale)",
          "gold-text":    "var(--gold-text)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
