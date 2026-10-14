/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#002B7F',
          dark: '#001A4D',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F5D97A',
          dark: '#A8883F',
        },
        lcd: {
          DEFAULT: '#9EA792',
          text: '#2A2F23',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F8F6F0',
        },
        cream: '#F5ECD7',
        parchment: '#E8DCC4',
        ink: '#121A2E',
        muted: '#6B7A99',
        line: '#E8E0CC',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        orbitron: ['Orbitron', 'ui-monospace', 'monospace'],
        inter: ['Inter', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        dome: '0 8px 0 var(--gold-dark), 0 14px 0 rgba(0,43,127,0.08), 0 24px 48px rgba(0,43,127,0.12)',
        glass: '0 4px 0 var(--gold-dark), 0 8px 20px rgba(0,43,127,0.12)',
        receipt: '0 20px 40px rgba(0,43,127,0.08)',
      },
      borderRadius: {
        dome: '28px',
        card: '20px',
        input: '14px',
      },
    },
  },
  plugins: [],
};
