/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sf-pro': ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        'sf-text': ['"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ios: {
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          pink: '#FF2D55',
          teal: '#5AC8FA',
          indigo: '#5856D6',
          gray1: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          gray4: '#D1D1D6',
          gray5: '#E5E5EA',
          gray6: '#F2F2F7',
          bg: '#F2F2F7',
          card: '#FFFFFF',
          separator: '#C6C6C8',
        }
      },
      borderRadius: {
        'ios': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
      },
      boxShadow: {
        'ios': '0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        'ios-lg': '0 0 0 0.5px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08)',
        'ios-xl': '0 4px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
