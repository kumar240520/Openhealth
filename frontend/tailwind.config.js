/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#00F2FE',
          cyan: '#4FACFE',
          emerald: '#10B981',
          accent: '#06B6D4',
          dark: '#070B14',
          card: '#0F172A',
          cardBorder: 'rgba(255, 255, 255, 0.1)',
        },
        emergency: {
          red: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.3)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-teal': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-cyan': '0 0 35px -5px rgba(79, 172, 254, 0.3)',
        'glow-red': '0 0 30px -5px rgba(239, 68, 68, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
