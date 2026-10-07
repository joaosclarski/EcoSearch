import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3f9',
          100: '#d5e0ee',
          200: '#aec2dc',
          300: '#7d9cc4',
          400: '#4f76a6',
          500: '#345a89',
          600: '#264870',
          700: '#1B365D',
          800: '#152a49',
          900: '#0f1f36',
          DEFAULT: '#1B365D',
        },
        eco: {
          50: '#e6f4f4',
          100: '#c2e5e5',
          200: '#8fcfcf',
          300: '#55b3b3',
          400: '#229797',
          500: '#008080',
          600: '#006d6d',
          700: '#005959',
          800: '#004545',
          900: '#003333',
          DEFAULT: '#008080',
        },
      },
      keyframes: {
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        pop: { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        sheet: 'sheet .3s cubic-bezier(.32,.72,0,1)',
        pop: 'pop .18s ease-out',
        fade: 'fade .2s ease-out',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
