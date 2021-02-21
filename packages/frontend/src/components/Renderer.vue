<template>
  <v-sheet style="height: 100%" class="transparent">
    <div
      id="rendererparent"
      ref="rendererparent"
      :class="`${fullScreen ? 'fullscreen' : ''} ${darkMode ? 'dark' : ''}`"
    >
      <v-fade-transition>
        <div v-show="!hasLoadedModel" class="overlay cover-all">
          <v-btn large class="vertical-center" @click="load()">
            <v-icon class="mr-3">mdi-cube-outline</v-icon>
            View Data
          </v-btn>
        </div>
      </v-fade-transition>
      <v-progress-linear
        v-if="hasLoadedModel && loadProgress < 99"
        v-model="loadProgress"
        height="4"
        rounded
        class="vertical-center elevation-10"
        style="position: absolute; width: 80%; left: 10%; opacity: 0.5"
      ></v-progress-linear>
      <v-card
        v-show="hasLoadedModel"
        style="position: absolute; bottom: 0px; z-index: 2; width: 100%"
        class="pa-0 text-center transparent elevation-0 pb-3"
      >
        <v-btn-toggle class="elevation-0">
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn :small="!fullScreen" v-bind="attrs" v-on="on" @click="zoomEx()">
                <v-icon small>mdi-cube-scan</v-icon>
              </v-btn>
            </template>
            Focus entire model
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn :small="!fullScreen" v-bind="attrs" @click="sectionToggle()" v-on="on">
                <v-icon small>mdi-scissors-cutting</v-icon>
              </v-btn>
            </template>
            Show / Hide Section plane
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn
                :small="!fullScreen"
                v-bind="attrs"
                @click="fullScreen = !fullScreen"
                v-on="on"
              >
                <v-icon small>{{ fullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
              </v-btn>
            </template>
            Full screen
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-btn :small="!fullScreen" v-bind="attrs" @click="showHelp = !showHelp" v-on="on">
                <v-icon small>mdi-help</v-icon>
              </v-btn>
            </template>
            Show viewer help
          </v-tooltip>
          <v-dialog v-model="showHelp" max-width="290">
            <v-card>
              <v-card-text class="pt-7">
                <v-icon class="mr-2">mdi-rotate-orbit</v-icon>
                Use your
                <b>left mouse button</b>
                to rotate the view.
                <br />
                <br />
                <v-icon class="mr-2">mdi-pan</v-icon>
                Use your
                <b>right mouse button</b>
                to pan the view.
                <br />
                <br />
                <v-icon class="mr-2">mdi-cursor-default-click</v-icon>
                <b>Double clicking an object</b>
                focus it in the camera view.
                <br />
                <br />
                <v-icon class="mr-2">mdi-cursor-default-click-outline</v-icon>
                <b>Double clicking on the background</b>
                will focus again the entire scene.
              </v-card-text>
            </v-card>
          </v-dialog>
        </v-btn-toggle>
      </v-card>
    </div>
  </v-sheet>
</template>
<script>
import throttle from 'lodash.throttle'
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
      hasLoadedModel: false,
      loadProgress: 0,
      fullScreen: false,
      showHelp: false
    }
  },
  computed: {
    darkMode() {
      return this.$vuetify.theme.dark
    }
  },
  watch: {
    fullScreen() {
      setTimeout(() => window.__viewer.onWindowResize(), 20)
    }
  },
  // TODO: pause rendering on destroy, reinit on mounted.
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

    if (window.__viewerLastLoadedUrl !== this.objectUrl) {
      window.__viewer.sceneManager.removeAllObjects()
      window.__viewerLastLoadedUrl = null
    } else {
      this.hasLoadedModel = true
      this.loadProgress = 100
    }
  },
  beforeDestroy() {
    // NOTE: here's where we juggle the container div out, and do cleanup on the
    // viewer end.
    // hide renderer dom element.
    this.domElement.style.display = 'none'
    // move renderer dom element outside this component so it doesn't get deleted.
    document.body.appendChild(this.domElement)
  },
  methods: {
    zoomEx() {
      window.__viewer.interactions.zoomExtents()
    },
    sectionToggle() {
      window.__viewer.interactions.toggleSectionBox()
    },
    load() {
      if (!this.objectUrl) return
      this.hasLoadedModel = true
      window.__viewer.loadObject(this.objectUrl)
      window.__viewerLastLoadedUrl = this.objectUrl
      window.__viewer.on(
        'load-progress',
        throttle(
          function (args) {
            this.loadProgress = args.progress * 100
            this.zoomEx()
          }.bind(this),
          200
        )
      )
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

.fullscreen {
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 10;
  /*background-color: rgb(58, 59, 60);*/
  background-color: rgb(238, 238, 238);
}

.dark {
  background-color: rgb(58, 59, 60) !important;
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
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(60, 94, 128, 0.8519782913165266) 0%,
    rgba(63, 123, 135, 0.13489145658263302) 100%
  );
  text-align: center;
}

.vertical-center {
  margin: 0;
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  z-index: 2;
}
</style>
