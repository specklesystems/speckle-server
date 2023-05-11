import speckleTheme from '@speckle/tailwind-theme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}',
    '@speckle/tailwind-theme/**.js'
  ],
  plugins: [speckleTheme]
}
