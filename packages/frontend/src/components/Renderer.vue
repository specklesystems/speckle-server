<template>
  <div id="rendererparent" ref="rendererparent">
    <v-fade-transition>
      <div v-show="!hasLoadedModel" class="overlay cover-all">
        <v-btn large class="button-load" @click="load()">
          <v-icon class="mr-3">mdi-cube-outline</v-icon>
          load
        </v-btn>
      </div>
    </v-fade-transition>
    <v-card
      v-show="hasLoadedModel"
      style="position: absolute; bottom: 0px; z-index: 2; width: 100%"
      class="pa-0 text-center transparent elevation-0 pb-3"
    >
      <v-btn-toggle class="elevation-10">
        <v-btn small @click="zoomEx()">
          <v-icon small>mdi-cube-scan</v-icon>
        </v-btn>
        <v-btn small @click="sectionToggle()">
          <v-icon small>mdi-scissors-cutting</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-card>
  </div>
</template>
<script>
import { Viewer } from '@speckle/viewer'

export default {
  components: {},
  props: {
    autoLoad: {
      type: Boolean,
      default: false
    },
    objectUrl: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      hasLoadedModel: false
    }
  },
  mounted() {
    // NOTE: we're doing some globals and dom shennanigans in here for the purpose
    // of having a unique global renderer and it's container dom element. The principles
    // are simple enough:
    // - create a single 'renderer' container div
    // - initialise the actual renderer **once** (per app lifecycle, on refresh it's fine)
    // - juggle the container div out of this component's dom when the component is managed out by vue
    // - juggle the container div back in of this component's dom when it's back.
    let renderDomElement = document.getElementById('renderer')

    if (!renderDomElement) {
      renderDomElement = document.createElement('div')
      renderDomElement.id = 'renderer'
    }

    this.domElement = renderDomElement
    this.domElement.style.display = 'inline-block'
    this.$refs.rendererparent.appendChild(renderDomElement)
    window.__viewer = window.__viewer || new Viewer({ container: renderDomElement })
    window.__viewer.onWindowResize()
  },
  beforeDestroy() {
    // NOTE: here's where we juggle the container div out, and do cleanup on the
    // viewer end.
    window.__viewer.sceneManager.removeAllObjects()
    // move renderer dom element outside this component so it doesn't get deleted.
    this.domElement.style.display = 'none'
    document.body.appendChild(this.domElement)
  },
  methods: {
    zoomEx() {
      window.__viewer.sceneManager.zoomExtents()
    },
    sectionToggle() {
      window.__viewer.sectionPlaneHelper.toggleSectionPlanes()
    },
    load() {
      if (!this.objectUrl) return
      this.hasLoadedModel = true
      window.__viewer.loadObject(this.objectUrl)
    }
  }
}
</script>
<style>
#rendererparent {
  position: absolute;
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

.overlay {
  position: relative;
  z-index: 2;
  text-align: center;
}

.cover-all {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(60, 94, 128, 0.8519782913165266) 0%,
    rgba(63, 123, 135, 0.13489145658263302) 100%
  );
}

.button-load {
  margin: 0;
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
}
</style>
