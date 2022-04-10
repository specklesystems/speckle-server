import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

let hasLocalStorage = typeof Storage !== 'undefined'

try {
  localStorage.setItem('foo', 'bar')
  localStorage.getItem('foo')
  localStorage.removeItem('foo')
} catch {
  hasLocalStorage = false
}

const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)').matches
const hasDarkMode = hasLocalStorage
  ? localStorage.getItem('darkModeEnabled')
  : darkMediaQuery
if (!hasDarkMode && darkMediaQuery && hasLocalStorage) {
  localStorage.setItem('darkModeEnabled', 'dark')
}

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    options: { customProperties: true },
    dark: hasLocalStorage ? localStorage.getItem('darkModeEnabled') === 'dark' : false,
    themes: {
      light: {
        primary: '#047EFB', //blue
        secondary: '#7BBCFF', //light blue
        accent: '#FCF25E', //yellow
        error: '#FF5555', //red
        warning: '#FF9100', //orange
        info: '#313BCF', //dark blue
        success: '#4caf50',
        text: '#FFFFFF',
        background: '#f5f6f7'
      },
      dark: {
        primary: '#047EFB', //blue
        secondary: '#7BBCFF', //light blue
        accent: '#FCF25E', //yellow
        error: '#FF5555', //red
        warning: '#FF9100', //orange
        info: '#313BCF', //dark blue
        success: '#4caf50',
        background: '#1a1a1a'
      }
    }
  }
})
