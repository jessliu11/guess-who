/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#F3F0E8',
        },
        background: '#FAF8F2',
        accent: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
        proBadge: '#1E1B4B',
        tipBg: '#FEF3C7',
        navy: '#1E1B4B',
      },
      fontFamily: {
        sans:    ['Poppins_400Regular', 'System'],
        medium:  ['Poppins_500Medium', 'System'],
        semibold:['Poppins_600SemiBold', 'System'],
        bold:    ['Poppins_700Bold', 'System'],
      },
    },
  },
  plugins: [],
};
