import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import '/assets/css/vtippy.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueTippy, {
    defaultProps: {
      arrow: false,
      animation: 'fade',
      theme: 'speckleTooltip',
      offset: [0, 8]
    },
    flipDuration: 0
  })
})
