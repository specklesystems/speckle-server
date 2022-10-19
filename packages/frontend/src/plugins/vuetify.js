import * as ThemeStateManager from '@/main/utils/themeStateManager'
import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

ThemeStateManager.initialize()
const isDarkMode = ThemeStateManager.isDarkTheme()

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    options: { customProperties: true },
    dark: isDarkMode,
    themes: {
      light: {
        primary: '#047EFB', //blue
        secondary: '#7BBCFF', //light blue
        accent: '#FCF25E', //yellow
        error: '#FF5555', //red
        warning: '#FF9100', //orange
        info: '#313BCF', //dark blue
        success: '#4caf50', // green
        text: '#000000', // black
        background: '#f5f6f7' // white
      },
      dark: {
        primary: '#047EFB', //blue
        secondary: '#7BBCFF', //light blue
        accent: '#FCF25E', //yellow
        error: '#FF5555', //red
        warning: '#FF9100', //orange
        info: '#9298f0', //dark blue
        success: '#4caf50', // green
        text: '#FFFFFF', // white
        background: '#1a1a1a' // black / dark grey
      }
    }
  }
})
