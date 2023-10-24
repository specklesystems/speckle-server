const speckleTheme = require('@speckle/tailwind-theme')
const { tailwindContentEntry } = require('@speckle/tailwind-theme/tailwind-configure')
const formsPlugin = require('@tailwindcss/forms')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}',
    tailwindContentEntry(require)
  ],
  plugins: [speckleTheme.default, formsPlugin]
}
