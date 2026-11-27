export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#faf6f2',
        ink: '#2a1520',
        muted: '#7a6470',
        line: '#eadfe3',
        plum: {
          50: '#f8eef3', 100: '#f0dbe6', 200: '#e2bcd0', 300: '#cf93b2', 600: '#8e2f5e',
          700: '#7a2350', 800: '#4a1630', 900: '#3a1026',
        },
      },
      fontFamily: { serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'] },
    },
  },
  plugins: [],
};
