import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import 'assets/css/vtippy.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueTippy, {
    defaultProps: {
      arrow: false,
      delay: [1000, 0],
      duration: [300, 0],
      animation: 'fade',
      theme: 'speckleTooltip',
      offset: [0, 4]
    },
    flipDuration: 0
  })
})
