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
        henequen: {
          cal: '#FAF8F5',
          sisal: '#EFE7D8',
          muro: '#FFFDF9',
          arena: '#E8E2D9',
          anil: '#1A3A5C',
          'anil-deep': '#132D47',
          verde: '#4A7C6F',
          'verde-dark': '#33605A',
          terra: '#B85C38',
          'terra-dark': '#9E4A2A',
          oro: '#C9A227',
          'oro-dark': '#8A6F1A',
          grafito: '#2C2C2C',
          piedra: '#6B6B6B',
        },
      },
      fontFamily: {
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        fraunces: ['Fraunces', 'Georgia', 'serif'],
        orbitron: ['Orbitron', 'ui-monospace', 'monospace'],
        inter: ['Inter', '-apple-system', 'sans-serif'],
        ibmmono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        dome: '0 8px 0 var(--gold-dark), 0 14px 0 rgba(0,43,127,0.08), 0 24px 48px rgba(0,43,127,0.12)',
        glass: '0 4px 0 var(--gold-dark), 0 8px 20px rgba(0,43,127,0.12)',
        receipt: '0 20px 40px rgba(0,43,127,0.08)',
        tarjeta: '0 2px 8px rgba(44,44,44,0.04)',
        pieza: '0 8px 28px -6px rgba(26,58,92,0.15)',
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
