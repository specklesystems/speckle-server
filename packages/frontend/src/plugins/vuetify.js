import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)').matches
const hasDarkMode = localStorage.getItem('darkModeEnabled')
if (!hasDarkMode && darkMediaQuery) {
  // console.log('setting dark mode')
  localStorage.setItem('darkModeEnabled', 'dark')
}

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    options: { customProperties: true },
    dark: localStorage.getItem('darkModeEnabled') === 'dark',
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
