/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['ABCNormal', 'Arial', 'sans-serif'],
      },
      fontSize: {
        xs: ['18.22px', { lineHeight: '20px' }],
        sm: ['19.18px', { lineHeight: '20px' }],
        base: ['19.18px', { lineHeight: '20px' }],
        md: ['31.07px', { lineHeight: '1.2' }],
        lg: ['46.61px', { lineHeight: '1.2' }],
        xl: ['93.21px', { lineHeight: '1.1' }],
        '2xl': ['153.44px', { lineHeight: '1' }],
      },
      spacing: {
        '1': '15.34px',
        '2': '19.68px',
        '3': '29.52px',
        '4': '31.07px',
      },
      transitionDuration: {
        instant: '200ms',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'var(--surface-base)',
        foreground: 'var(--text-secondary)',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'var(--surface-base)',
        },
        popover: {
          DEFAULT: 'var(--surface-base)',
          foreground: 'var(--text-secondary)',
        },
        card: {
          DEFAULT: 'var(--surface-base)',
          foreground: 'var(--text-secondary)',
        },
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-inverse': 'var(--text-inverse)',
        'surface-base': 'var(--surface-base)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: '200px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
