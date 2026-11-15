/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg-primary)',
        elevated: 'var(--bg-elevated)',
        'elevated-2': 'var(--bg-elevated-2)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-indigo': 'var(--accent-indigo)',
        'accent-violet': 'var(--accent-violet)',
        'accent-pink': 'var(--accent-pink)',
        'accent-success': 'var(--accent-success)',
        'accent-warning': 'var(--accent-warning)',
        'accent-danger': 'var(--accent-danger)',
        'glass-fill': 'var(--glass-fill)',
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #9B6BFF 50%, #EC4899 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      fontFamily: {
        sans: ['"Aptos"', '"Inter"', 'sans-serif'],
        mono: ['"Aptos"', '"Inter"', 'sans-serif'], // Enforce single font style
      },
      fontSize: {
        'micro': ['11px', { lineHeight: '14px', letterSpacing: '0.12em', fontWeight: '600' }],
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['22px', { lineHeight: '32px' }],
        '2xl': ['28px', { lineHeight: '36px' }],
        '3xl': ['36px', { lineHeight: '44px' }],
        'hero': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'pill': 'var(--radius-pill)',
      },
      boxShadow: {
        'colored': '0 20px 60px -15px rgba(99,102,241,0.25)',
        'colored-lg': '0 25px 70px -12px rgba(155,107,255,0.3)',
        'glow-indigo': '0 0 25px rgba(99,102,241,0.4)',
        'glow-pink': '0 0 25px rgba(236,72,153,0.4)',
        'glow-success': '0 0 15px rgba(34,211,165,0.5)',
        'subtle-elevation': '0 10px 30px -10px rgba(7,7,12,0.8)',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'orb-drift': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.08)' },
          '66%': { transform: 'translate(-30px, 40px) scale(0.92)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        'wave-dash': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        }
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'orb-drift': 'orb-drift 22s ease-in-out infinite',
        'orb-drift-slow': 'orb-drift 30s ease-in-out infinite alternate',
        'orb-drift-fast': 'orb-drift 18s ease-in-out infinite alternate-reverse',
        'shake': 'shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'wave': 'wave-dash 20s linear infinite',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities, addComponents }) {
      addUtilities({
        '.glass': {
          backgroundColor: 'var(--glass-fill)',
          backdropFilter: 'var(--glass-blur)',
          '-webkit-backdrop-filter': 'var(--glass-blur)',
          border: '1px solid var(--border-subtle)',
        },
        '.gradient-text': {
          backgroundImage: 'var(--gradient-primary)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.grain-overlay': {
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        },
      });
    }),
  ],
};