import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground))',
      },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px 0 rgba(34, 211, 238, 0.4)' },
          '50%': { boxShadow: '0 0 25px 5px rgba(34, 211, 238, 0.7)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'blue-noise':
          'repeating-radial-gradient(circle closest-side, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.05) 2%, transparent 2%, transparent 6%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
  safelist: [
    // TabNavigation dynamic classes
    'border-cyan-500/30',
    'border-pink-500/30',
    'border-amber-500/30',
    'border-red-500/30',
    'border-gray-500/30',
    'text-cyan-300',
    'text-pink-300',
    'text-amber-300',
    'text-red-300',
    'text-gray-300',
    'bg-cyan-900/30',
    'bg-pink-900/30',
    'bg-amber-900/30',
    'bg-red-900/30',
    'bg-gray-800/30',
    'from-cyan-600',
    'to-blue-600',
    'from-pink-600',
    'to-purple-600',
    'from-amber-500',
    'to-orange-500',
    'from-red-600',
    'to-orange-600',
    'from-cyan-600',
    'to-sky-600',
    'from-gray-600',
    'to-slate-600',
  ],
} satisfies Config;

export default config;
