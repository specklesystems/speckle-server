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
      '$vuetify.breakpoint.name'() {
        // Vuetify breakpoint service sometimes kicks in late, triggering
        // a final update handler on next tick
        clearTimeout(this.breakpointTimeout)
        this.breakpointTimeout = setTimeout(() => this.onWindowResize, 0)
      }
    },
    methods: {
      onWindowResize(e) {
        console.warn('Resize handler mixin onWindowResize method not overridden!', e)
      }
    }
  }
}
