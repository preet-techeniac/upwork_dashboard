import type { Config } from 'tailwindcss';

export default <Config>{
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(220, 80%, 55%)',
        accent: 'hsl(165, 70%, 45%)',
      },
    },
  },
  plugins: [],
};
