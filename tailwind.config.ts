import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#06070B',
        velvet: '#0D111A',
        mist: '#95A7C3',
        pearl: '#F3EEE7',
        cyan: '#6ED9FF',
        amber: '#F6B76A',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Avenir Next"', 'sans-serif'],
        body: ['"DM Sans"', '"SF Pro Display"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(110, 217, 255, 0.18), 0 24px 120px rgba(12, 24, 56, 0.55)',
        card: '0 18px 60px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at 20% 20%, rgba(110, 217, 255, 0.18), transparent 38%), radial-gradient(circle at 80% 15%, rgba(246, 183, 106, 0.2), transparent 32%), linear-gradient(180deg, #080B13 0%, #06070B 100%)',
        glass: 'linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
