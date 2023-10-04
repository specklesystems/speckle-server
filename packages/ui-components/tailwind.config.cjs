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
  theme: {
    extend: {
      // Standard Tailwind Shadows add shadows below the element, 'shadow-t" variant adds shadow to the top of the element.
      boxShadow: {
        t: '0 -1px 3px 0 rgb(0 0 0 / 10%), 0 -1px 2px -1px rgb(0 0 0 / 6%)'
      },
      backdropBlur: {
        xs: '1px'
      }
    }
  },
  plugins: [speckleTheme.default, formsPlugin]
}
