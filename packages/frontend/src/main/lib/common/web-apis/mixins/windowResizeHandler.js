import { throttle, debounce } from 'lodash'

/**
 * Window resize handler mixin with debounce/throttle built in
 */

export function buildResizeHandlerMixin({ shouldThrottle, wait } = {}) {
  const waitTime = wait || 100

  return {
    mounted() {
      this.resizeHandler = shouldThrottle
        ? throttle(this.onWindowResize, waitTime)
        : debounce(this.onWindowResize, waitTime)
      window.addEventListener('resize', this.resizeHandler)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.resizeHandler)
    },
    watch: {
      '$vuetify.breakpoint': {
        handler() {
          // Vuetify breakpoint service sometimes kicks in late, so we're triggering
          // a final update handler on next tick to make sure any code that depends on $vuetify.breakpoint
          // can be updated as well
          this.resizeHandler()
        },
        deep: true
      }
    },
    methods: {
      onWindowResize(e) {
        console.warn('Resize handler mixin onWindowResize method not overridden!', e)
      }
    }
  }
}
