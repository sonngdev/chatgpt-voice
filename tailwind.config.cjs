/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 0.4 },
        },
      },
    },
  },
  plugins: [],
}
