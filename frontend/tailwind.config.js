export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'ui-serif', 'serif'],   // ← NEW
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'], // ← NEW
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'ink-in': {
          '0%': { opacity: 0, filter: 'blur(2px)' },
          '100%': { opacity: 1, filter: 'blur(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'scale-in': 'scale-in 0.3s ease-out',
        'ink-in': 'ink-in 0.5s ease-out',
      },
    },
  },
  plugins: [],
}