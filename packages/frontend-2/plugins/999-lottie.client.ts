import { DotLottieVue } from '@lottiefiles/dotlottie-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('DotLotVue', DotLottieVue)
})
