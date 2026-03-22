/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0b5ed7',
          50: '#e7f0ff',
          100: '#cfdeff',
          200: '#9fbfff',
          300: '#6fa0ff',
          400: '#3f80ff',
          500: '#0b5ed7',
          600: '#0a4bb0',
          700: '#083a88',
        },
        surface: {
          100: '#f8fafc',
          200: '#f1f5f9',
        },
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
