import type { Config } from 'tailwindcss';

// 디자인 토큰은 HTML 프로토타입(더프렌즈_온보딩허브_v2.html)의 CSS 변수와 동일하게 유지합니다.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#0365db',
          dark: '#0254b8',
          light: '#ebf3fe',
        },
        gray: {
          50: '#f9fafb',
          100: '#f2f4f6',
          200: '#e5e8eb',
          300: '#d1d6db',
          500: '#8b95a1',
          700: '#4e5968',
          900: '#191f28',
        },
      },
      borderRadius: {
        card: '16px',
        'card-sm': '10px',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
