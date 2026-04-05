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
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5b8fc',
          400: '#8193f8',
          500: '#6471f1',
          600: '#4f4ee5',
          700: '#4040ca',
          800: '#3535a3',
          900: '#2f3181',
          950: '#1c1d4b',
        },
        surface: {
          DEFAULT: '#0F172A',
          card: '#1E293B',
          elevated: '#273548',
        },
        accent: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        heading: ['Inter-Bold', 'System'],
      },
    },
  },
  plugins: [],
};
