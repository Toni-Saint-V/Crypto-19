/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'carbon-dark': '#0D0F12',
        'carbon-light': '#1A1C22',
        'accent-turquoise': '#21D4B4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '8px': '8px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '40px': '40px',
        '48px': '48px',
        '56px': '56px',
        '64px': '64px',
        '80px': '80px',
        '96px': '96px',
      },
    },
  },
  plugins: [],
}
