/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7F8', // blush-50
          100: '#FFE4E8', // rose-100
          200: '#ffbdc6',
          300: '#ff8a9a',
          400: '#ff4d64',
          500: '#E11D48', // rose-500
          600: '#C8102E', // blood-600
          700: '#A3122B', // crimson-700
          800: '#7A0C1F', // crimson-800
          900: '#3B0610', // crimson-950
          950: '#14080B', // wine background
        },
        ink:  '#1F1214',
        surface: '#FFF7F8',
        'surface-dark': '#14080B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(179, 18, 43, 0.08)',
        'glass-lg': '0 20px 60px 0 rgba(179, 18, 43, 0.12)',
        card: '0 2px 16px rgba(31, 18, 20, 0.06)',
        'card-hover': '0 8px 32px rgba(31, 18, 20, 0.12)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'draw': 'draw 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%':      { transform: 'scale(1.2)' },
          '28%':      { transform: 'scale(1)' },
          '42%':      { transform: 'scale(1.15)' },
          '70%':      { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        draw: {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
