/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors
        'brand-dark': '#1e1927',
        'brand-accent': '#42bea5',
        'brand-secondary': '#dfaeff',
        'brand-action': '#4137ff',
        // Semantic aliases
        primary: {
          DEFAULT: '#4137ff',
          hover: '#3530e0',
          light: '#eeeeff',
        },
        success: {
          DEFAULT: '#42bea5',
          light: '#edf9f6',
          dark: '#2e9e87',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f8fc',
          tertiary: '#f1f0f8',
        },
        border: {
          DEFAULT: '#e5e3ef',
          strong: '#c8c4dc',
        },
        text: {
          primary: '#1e1927',
          secondary: '#5c5875',
          muted: '#9490aa',
          inverse: '#ffffff',
        },
        overdue: {
          DEFAULT: '#ef4444',
          light: '#fef2f2',
          dark: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fffbeb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(30,25,39,0.08), 0 1px 2px -1px rgba(30,25,39,0.06)',
        'card-hover': '0 4px 12px 0 rgba(30,25,39,0.12)',
        dialog: '0 20px 60px rgba(30,25,39,0.2)',
        sm: '0 1px 2px 0 rgba(30,25,39,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        skeleton: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
