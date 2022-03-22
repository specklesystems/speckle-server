<template lang="html">
  <div style="height: 100%; position: relative" class="transparent">
    <div
      id="rendererparent"
      ref="rendererparent"
      :class="`background-${$vuetify.theme.dark ? 'dark' : 'light'}`"
    ></div>
  </div>
</template>
<script>
import { Viewer } from '@speckle/viewer'
import throttle from 'lodash/throttle'

export default {
  data() {
    return {}
  },
  watch: {
    fullScreen() {
      setTimeout(() => {
        window.__viewer.onWindowResize()
        window.__viewer.cameraHandler.onWindowResize()
      }, 20)
    }
  },
  // TODO: pause rendering on destroy, reinit on mounted.
  async mounted() {
    // NOTE: we're doing some globals and dom shennanigans in here for the purpose
    // of having a unique global renderer and it's container dom element. The principles
    // are simple enough:
    // - create a single 'renderer' container div
    // - initialise the actual renderer **once** (per app lifecycle, on refresh it's fine)
    // - juggle the container div out of this component's dom when the component is managed out by vue
    // - juggle the container div back in of this component's dom when it's back.

    this.$mixpanel.track('Viewer Action', { type: 'action', name: 'load' })
    let renderDomElement = document.getElementById('renderer')
    if (!renderDomElement) {
      renderDomElement = document.createElement('div')
      renderDomElement.id = 'renderer'
    }
    if (!window.__viewer) {
      window.__viewer = new Viewer({ container: renderDomElement, showStats: false })
    }

    this.domElement = renderDomElement
    this.domElement.style.display = 'inline-block'
    this.$refs.rendererparent.appendChild(renderDomElement)

    await window.__viewer.unloadAll()

    window.__viewer.onWindowResize()
    window.__viewer.cameraHandler.onWindowResize()
    this.setupEvents()
    this.$emit('viewer-init')
    this.$eventHub.$on('resize-viewer', () => {
      window.__viewer.onWindowResize()
      window.__viewer.cameraHandler.onWindowResize()
    })
  },
  beforeDestroy() {
    // NOTE: here's where we juggle the container div out, and do cleanup on the
    // viewer end.
    // hide renderer dom element.
    this.domElement.style.display = 'none'
    // move renderer dom element outside this component so it doesn't get deleted.
    document.body.appendChild(this.domElement)
    window.__viewer.unloadAll()
  },
  methods: {
    setupEvents() {
      window.__viewer.on('load-warning', ({ message }) => {
        this.$eventHub.$emit('notification', {
          text: message
        })
      })

      window.__viewer.on(
        'load-progress',
        throttle((args) => this.$emit('load-progress', args), 250)
      )
      window.__viewer.on('select', (objects) => this.$emit('selection', objects))
    }
  }
}
</script>
<style>
#rendererparent {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
}

#renderer {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.fullscreen {
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 10;
}
</style>
