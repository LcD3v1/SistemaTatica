import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:    '#050505',
        sb:    '#080808',
        card:  '#0e0e0e',
        card2: '#141414',
        bdr:   '#1c180a',
        bdr2:  '#28200d',
        bdrg:  '#3d3010',
        txt:   '#ede8d8',
        txt2:  '#8a7a55',
        txt3:  '#4a4030',
        gold:  '#c9a227',
        gold2: '#d4af37',
        gold3: '#f0c040',
        green: '#27ae60',
        red:   '#c0392b',
        blue:  '#2980b9',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono:     ['Share Tech Mono', 'monospace'],
        body:     ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
