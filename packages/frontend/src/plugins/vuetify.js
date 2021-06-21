import "@mdi/font/css/materialdesignicons.css";
import Vue from "vue";
import Vuetify from "vuetify/lib";

Vue.use(Vuetify);

let darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
let hasDarkMode = localStorage.getItem("darkModeEnabled");
if (!hasDarkMode && darkMediaQuery) {
  localStorage.setItem("darkModeEnabled", "dark");
}

export default new Vuetify({
  icons: {
    iconfont: "mdi"
  },
  theme: {
    options: { customProperties: true },
    dark: localStorage.getItem("darkModeEnabled") === "dark",
    themes: {
      light: {
        primary: "#047EFB", //blue
        secondary: "#7BBCFF", //light blue
        accent: "#FCF25E", //yellow
        error: "#FF5555", //red
        warning: "#FF9100", //orange
        info: "#313BCF", //dark blue
        success: "#4caf50",
        background: "#eeeeee",
        text: "#FFFFFF",
      },
      dark: {
        primary: "#047EFB", //blue
        secondary: "#7BBCFF", //light blue
        accent: "#FCF25E", //yellow
        error: "#FF5555", //red
        warning: "#FF9100", //orange
        info: "#313BCF", //dark blue
        success: "#4caf50",
        background: "#3a3b3c",
      }
    }
  },
  font: {
    family: "Space Grotesk"
  }
});
