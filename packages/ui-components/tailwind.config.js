import speckleTheme, {
  tailwindContentEntry as themeEntry
} from '@speckle/tailwind-theme'
import { createRequire } from 'module'

const req = createRequire(import.meta.url)

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,vue}', themeEntry(req)],
  plugins: [speckleTheme]
}
