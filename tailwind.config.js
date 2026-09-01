/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FBFAF7',
        ink: '#14213B',
        wire: '#B08D3E',
        slate: '#5B5647',
        line: '#E4E0D6',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};