import { defineNuxtPlugin } from '#app'
import VueKonva from 'vue-konva'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueKonva)
})
