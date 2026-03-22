import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#6c47e8',
        'brand-light': '#ede8fb',
        'brand-mid': '#d4ccf5',
        'bg-page': '#f0edf8',
        'bg-surface': '#f7f5fc',
        'text-primary': '#1a1530',
        'text-secondary': '#6a6085',
        'text-muted': '#a89ec8',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Mulish', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
    },
  },
  plugins: [],
}

export default config
