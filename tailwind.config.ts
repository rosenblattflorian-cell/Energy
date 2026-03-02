import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./apps/web/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: []
};

export default config;
