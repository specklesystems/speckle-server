const speckleTheme = require('./dist-cjs/plugin.js')
const formsPlugin = require('@tailwindcss/forms')

const plugin = speckleTheme.default
const lightThemeVariables = speckleTheme.lightThemeVariables

const buildThemeReplacements = (vars) => {
  const res = {}
  for (const [key, val] of Object.entries(vars)) {
    res[`var(${key})`] = val
  }
  return res
}

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [],
  plugins: [plugin, formsPlugin],
  theme: {
    // Config viewer options
    configViewer: {
      themeReplacements: buildThemeReplacements(lightThemeVariables)
    }
  }
}

module.exports = config
