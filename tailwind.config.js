/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #8B5CF6)',
        'dark-text': '#0F172A',
        'light-bg': '#FFFFFF',
      },
    },
  },
  plugins: [],
}

