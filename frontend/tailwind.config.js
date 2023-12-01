/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'initial-width': {
          '0%': { width: '0%' },
        },
      },
      animation: {
        slider: 'initial-width 1000ms ease-in-out forwards',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
