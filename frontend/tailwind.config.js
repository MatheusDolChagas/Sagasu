import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--app-bg)",
        foreground: "var(--app-text)",
        card: "var(--app-surface)",
        border: "var(--app-border)",
        ring: "var(--app-ring)",
        muted: "var(--app-text-muted)",
        "muted-bg": "var(--app-muted-bg)",
        primary: "var(--app-primary)",
        "primary-fg": "var(--app-primary-fg)",
        accent: "var(--app-accent)",
        "accent-fg": "var(--app-accent-fg)",
        forest: "var(--app-forest)",
        /* Alias usado no código legado (text-dark) */
        dark: "var(--app-text)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
