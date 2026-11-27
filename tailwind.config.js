export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3B82F6',
          azure: '#3B82F6',
          royal: '#2563EB',
          sky: '#60A5FA',
          pale: '#93C5FD',
          indigo: '#7C76FF',
        },
        primary: {
          DEFAULT: 'var(--color-primary, #3B82F6)',
          dark: 'var(--color-primary-dark, #2563EB)',
          light: 'var(--color-primary-light, #60A5FA)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #8B5CF6)',
          light: 'var(--color-secondary-light, #A78BFA)',
        },
        background: {
          DEFAULT: 'var(--color-background, #0B0D10)',
          dark: 'var(--color-background-dark, #07090C)',
          light: 'var(--color-background-light, #12161C)',
          elevated: 'var(--color-background-elevated, #161B22)',
          popover: 'var(--color-background-popover, #1E2630)',
        },
        card: {
          DEFAULT: 'var(--color-card, #12161C)',
        },
        text: {
          DEFAULT: 'var(--color-text, #F8FAFC)',
          muted: 'var(--color-text-muted, #A1A8B3)',
          subtle: 'var(--color-text-subtle, #94A3B8)',
          subtler: 'var(--color-text-subtler, #64748B)',
        },
        border: {
          DEFAULT: 'var(--color-border, #292D33)',
          subtle: 'var(--color-border-subtle, #292D33)',
          subtler: 'var(--color-border-subtler, rgba(41, 45, 51, 0.5))',
        },
        status: {
          success: 'var(--color-status-success, #4ADE80)',
          warning: 'var(--color-status-warning, #FBBF24)',
          error: 'var(--color-status-error, #F87171)',
          info: 'var(--color-status-info, #7DD3FC)',
        },
      },
      spacing: {
        'brand-xs': '0.5rem',
        'brand-sm': '1rem',
        'brand-md': '1.5rem',
        'brand-lg': '2rem',
        'brand-xl': '3rem',
      },
    },
  },
  plugins: [],
};
