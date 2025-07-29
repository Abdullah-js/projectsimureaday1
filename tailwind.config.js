/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'skull-bounce': {
          '0%, 100%': { transform: 'translateY(0) rotate(-12deg)' },
          '25%': { transform: 'translateY(-5px) rotate(-15deg)' },
          '50%': { transform: 'translateY(0) rotate(-12deg)' },
          '75%': { transform: 'translateY(-3px) rotate(-10deg)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'skull-bounce': 'skull-bounce 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
