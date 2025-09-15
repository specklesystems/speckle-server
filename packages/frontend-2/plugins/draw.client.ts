import { defineNuxtPlugin } from '#app'
import { installDraw } from '@speckle/draw'

export default defineNuxtPlugin((nuxtApp) => {
  installDraw(nuxtApp.vueApp)
})
