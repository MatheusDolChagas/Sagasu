/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b6dbbf',
        accent: '#e1583f',
        background: '#e8e6d9',
        dark: '#422329',
      },
    },
  },
  plugins: [],
}
