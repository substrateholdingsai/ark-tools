/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        /* Target tokens (Qwen) */
        paper: {
          DEFAULT: '#F4F2ED',
          2: '#EDEAE3',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#FAF9F6',
        },
        ink: {
          DEFAULT: '#12171F',
          2: '#1B2330',
          3: '#2A3441',
        },
        slate: '#4A5566',
        muted: '#6E747E',
        faint: '#9AA0A9',
        line: {
          DEFAULT: '#E2DED5',
          2: '#D3CEC3',
        },
        brass: {
          DEFAULT: '#8A6D22',
          2: '#B08D3F',
          wash: '#F7F1E1',
        },
        ok: {
          DEFAULT: '#1E6B47',
          wash: '#E8F2EC',
        },
        warn: {
          DEFAULT: '#8F5D06',
          wash: '#FAF0DC',
        },
        bad: {
          DEFAULT: '#8B2C2C',
          wash: '#F8E9E7',
        },
        info: {
          DEFAULT: '#2B5478',
          wash: '#E9F0F6',
        },
        ledger: '#EFF4EE',

        /* Legacy aliases (ARK v1.0) */
        navy: {
          DEFAULT: '#1B2330',
          dark: '#12171F',
        },
        gold: {
          DEFAULT: '#B08D3F',
          light: '#F7F1E1',
          dark: '#8A6D22',
        },
        lcd: {
          DEFAULT: '#EFF4EE',
          text: '#12171F',
        },
        cream: '#EDEAE3',
        parchment: '#D3CEC3',
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
        /* Target */
        sans: [
          '"IBM Plex Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        serif: ['"IBM Plex Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        /* Legacy */
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        fraunces: ['Fraunces', 'Georgia', 'serif'],
        orbitron: ['Orbitron', 'ui-monospace', 'monospace'],
        inter: ['Inter', '-apple-system', 'sans-serif'],
        ibmmono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        /* Target */
        sh1: '0 1px 2px rgba(18,23,31,.05)',
        sh2: '0 12px 32px -8px rgba(18,23,31,.22), 0 2px 8px rgba(18,23,31,.08)',
        sh3: '0 32px 80px -16px rgba(18,23,31,.38)',
        /* Legacy */
        dome: '0 8px 0 var(--gold-dark), 0 14px 0 rgba(0,43,127,0.08), 0 24px 48px rgba(0,43,127,0.12)',
        glass: '0 4px 0 var(--gold-dark), 0 8px 20px rgba(0,43,127,0.12)',
        receipt: '0 20px 40px rgba(0,43,127,0.08)',
        tarjeta: '0 2px 8px rgba(44,44,44,0.04)',
        pieza: '0 8px 28px -6px rgba(26,58,92,0.15)',
      },
      borderRadius: {
        /* Target */
        r1: '3px',
        r2: '5px',
        r3: '8px',
        /* Legacy */
        dome: '28px',
        card: '20px',
        input: '14px',
      },
    },
  },
  plugins: [],
};
