<template>
  <div id="rendererparent" ref="rendererparent">
    <div class="pre-load">
      <v-btn @click="load()">load</v-btn>
    </div>
    <div></div>
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
    window.__viewer.sceneManager.removeAllObjects()
    // move renderer dom element outside this component so it doesn't get deleted.
    this.domElement.style.display = 'none'
    document.body.appendChild(this.domElement)
  },
  methods: {
    load() {
      if (!this.objectUrl) return
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
  top:0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.pre-load{
  position: relative;
  z-index: 2;
}
</style>
