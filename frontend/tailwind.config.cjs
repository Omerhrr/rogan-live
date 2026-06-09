/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'rogan-primary': '#E91E63',
        'rogan-secondary': '#9C27B0',
        'rogan-accent': '#FF4081',
        'rogan-dark': '#121212',
        'rogan-surface': '#1E1E1E',
        'rogan-card': '#2D2D2D',
        'rogan-border': '#3D3D3D',
      },
      animation: {
        'gift-float': 'gift-float 3s ease-out forwards',
        'gift-pulse': 'gift-pulse 0.6s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'rocket-fly': 'rocket-fly 2s ease-out forwards',
        'heart-beat': 'heart-beat 1s ease-in-out infinite',
      },
      keyframes: {
        'gift-float': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '0.8', transform: 'translateY(-40vh) scale(1.2)' },
          '100%': { opacity: '0', transform: 'translateY(-80vh) scale(0.8)' },
        },
        'gift-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'rocket-fly': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '30%': { opacity: '1', transform: 'translateY(-20vh) scale(1.5)' },
          '100%': { opacity: '0', transform: 'translateY(-100vh) scale(0.5)' },
        },
        'heart-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '40%': { transform: 'scale(1)' },
          '60%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
};
