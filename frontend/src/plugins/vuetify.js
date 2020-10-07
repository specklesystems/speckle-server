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
        primary: "#2196f3",
        secondary: "#607d8b",
        accent: "#03a9f4",
        error: "#ff5722",
        warning: "#ffc107",
        info: "#3f51b5",
        success: "#4caf50"
      }
    }
  }
})
