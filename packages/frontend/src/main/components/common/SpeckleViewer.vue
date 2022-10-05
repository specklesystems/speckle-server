<template>
  <div style="height: 100vh; position: relative" class="speckle-viewer transparent">
    <div
      id="rendererparent"
      ref="rendererparent"
      :class="`${
        $route.query.transparent === 'true'
          ? ''
          : $vuetify.theme.dark
          ? 'background-dark'
          : 'background-light'
      }`"
    ></div>
  </div>
</template>
<script>
import throttle from 'lodash/throttle'
import { onKeyStroke } from '@vueuse/core'
import { useInjectedViewer } from '@/main/lib/viewer/core/composables/viewer'
import {
  useCommitObjectViewerParams,
  handleViewerSelection,
  resetSelection,
  handleViewerDoubleClick
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { ViewerEvent } from '@speckle/viewer'

export default {
  name: 'SpeckleViewer',
  props: {
    noScroll: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const { viewer, container, isInitializedPromise } = useInjectedViewer()
    const { isEmbed } = useCommitObjectViewerParams()
    return {
      viewer,
      viewerContainer: container,
      isViewerInitializedPromise: isInitializedPromise,
      isEmbed
    }
  },
  async mounted() {
    // NOTE: we're doing some globals and dom shennanigans in here for the purpose
    // of having a unique global renderer and it's container dom element. The principles
    // are simple enough:
    // - create a single 'renderer' container div
    // - initialise the actual renderer **once** (per app lifecycle, on refresh it's fine)
    // - juggle the container div out of this component's dom when the component is managed out by vue
    // - juggle the container div back in of this component's dom when it's back.

    this.$mixpanel.track('Viewer Action', { type: 'action', name: 'load' })

    if (!this.viewer || !this.viewerContainer || !this.isViewerInitializedPromise) {
      throw new Error('Viewer or its container not properly injected!')
    }

    await this.isViewerInitializedPromise

    this.domElement = this.viewerContainer
    this.domElement.style.display = 'inline-block'
    this.$refs.rendererparent.appendChild(this.domElement)

    await this.viewer.unloadAll()

    if (this.noScroll && this.isEmbed) {
      this.viewer.cameraHandler.controls.mouseButtons.wheel = 0
    } else {
      // this.viewer.cameraHandler.controls.mouseButtons.wheel = 8
    }

    this.viewer.resize()
    this.viewer.cameraHandler.onWindowResize()
    this.setupEvents()
    this.$emit('viewer-init')
    this.$eventHub.$on('resize-viewer', () => {
      this.viewer.resize()
      this.viewer.cameraHandler.onWindowResize()
    })
  },
  beforeDestroy() {
    // NOTE: here's where we juggle the container div out, and do cleanup on the
    // viewer end.
    // hide renderer dom element.
    this.domElement.style.display = 'none'
    // move renderer dom element outside this component so it doesn't get deleted.
    document.body.appendChild(this.domElement)
    this.viewer.unloadAll()
  },
  methods: {
    setupEvents() {
      this.viewer.on('load-warning', ({ message }) => {
        this.$eventHub.$emit('notification', {
          text: message
        })
      })

      this.viewer.on(
        ViewerEvent.LoadProgress,
        throttle((args) => this.$emit(ViewerEvent.LoadProgress, args), 250)
      )

      this.viewer.on(ViewerEvent.ObjectClicked, (selectionInfo) => {
        handleViewerSelection(selectionInfo)
      })

      this.viewer.on(ViewerEvent.ObjectDoubleClicked, (selectionInfo) => {
        handleViewerDoubleClick(selectionInfo)
      })

      onKeyStroke('Escape', () => {
        resetSelection()
      })
    }
  }
}
</script>
<style>
#rendererparent {
  position: relative;
  display: block;
  width: 100%;
  height: 100vh;
}

#renderer {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100vh;
  z-index: 1;
}

.fullscreen {
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 10;
}
</style>
