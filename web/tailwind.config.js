/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Covenant Brand Colors
        brown: {
          deep: '#2c1810',
          mid: '#5a2d1a',
          warm: '#6b3322',
        },
        gold: {
          DEFAULT: '#c8943a',
          light: '#e8c49a',
        },
        cream: '#fdf8f3',
        green: {
          deep: '#2c5f2e',
        },
        purple: '#7c5cbf',
        dark: {
          bg: '#1a0f08',
          card: '#2c1810',
        },
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Lato', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
