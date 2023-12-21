import 'tippy.js/dist/tippy.css'
import VueTippy from 'vue-tippy'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueTippy, {
    defaultProps: {
      arrow: true
    },
    flipDuration: 0
  })
})
