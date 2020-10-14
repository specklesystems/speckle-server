import "@mdi/font/css/materialdesignicons.css"
import Vue from "vue"
import Vuetify from "vuetify/lib"

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: "mdi"
  },
  theme: {
    themes: {
      light: {
        primary: "#047EFB", //blue
        secondary: "#7BBCFF", //light blue
        accent: "#FCF25E", //yellow
        error: "#FF5555", //red
        warning: "#FF9100", //orange
        info: "#313BCF", //dark blue
        success: "#4caf50"
      }
    }
  }
})
