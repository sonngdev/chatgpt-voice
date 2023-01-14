/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['DM Mono', 'monospace'],
        title: ['Major Mono Display', 'monospace'],
      },
      colors: {
        light: '#FFFCE8',
        dark: '#191308',
        accent1: '#028090',
        accent2: '#C64191',
      },
      animation: {
        blink: 'blink 2s infinite',
        'spin-2': 'spin 2s linear infinite',
        'fade-in': 'fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'rise-up': 'rise-up 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 100 },
        },
        'rise-up': {
          '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(0.96)' },
          '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
