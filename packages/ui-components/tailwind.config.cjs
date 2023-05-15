const speckleTheme = require('@speckle/tailwind-theme')
const formsPlugin = require('@tailwindcss/forms')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}',
    speckleTheme.tailwindContentEntry(require)
  ],
  plugins: [speckleTheme.default, formsPlugin]
}
