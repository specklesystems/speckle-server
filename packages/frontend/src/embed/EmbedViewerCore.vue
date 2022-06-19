<template>
  <div class="embed-viewer-core">
    <!-- Viewer navbar (position fixed) -->
    <div v-if="!error" style="z-index: 100">
      <div
        class="top-left bottom-left pa-4 d-flex justify-space-between"
        style="right: 0px; position: fixed; z-index: 1000; width: 100%"
      >
        <v-btn fab small style="z-index=1000" @click="drawer = !drawer">
          <v-icon>mdi-menu</v-icon>
        </v-btn>
        <span v-show="!drawer" class="caption d-inline-flex align-center">
          <img src="@/assets/logo.svg" height="18" />
          <span style="margin-top: 2px" class="primary--text">
            <a href="https://speckle.xyz" target="_blank" class="text-decoration-none">
              <b>Powered by Speckle</b>
            </a>
          </span>
        </span>
      </div>
      <div
        v-show="!drawer && loadedModel"
        class="caption grey--text pa-2"
        style="z-index=1000"
      ></div>
      <div
        class="pa-2 d-flex align-center justify-space-between caption"
        style="position: fixed; bottom: 0; width: 100%"
      >
        <portal to="viewercontrols">
          <v-btn
            v-tooltip="'View extra details in Speckle!'"
            icon
            dark
            large
            class="elevation-5 primary pa-0 ma-o"
            :href="goToServerUrl"
            target="blank"
          >
            <v-icon dark small>mdi-open-in-new</v-icon>
          </v-btn>
        </portal>
      </div>
      <div
        :style="`width: 100%; bottom: 12px; left: 0px; position: ${
          $isMobile() ? 'fixed' : 'absolute'
        }; z-index: 20`"
        :class="`d-flex justify-center`"
      >
        <viewer-controls v-show="loadedModel" />
      </div>
    </div>

    <!-- Model loading progress bar -->
    <div
      v-if="!loadedModel && loadProgress > 0"
      class="viewer-loader d-flex fullscreen align-center justify-center"
    >
      <v-progress-linear
        v-model="loadProgress"
        :indeterminate="loadProgress >= 99 && !loadedModel"
        color="primary"
        style="max-width: 30%"
      ></v-progress-linear>
    </div>

    <!-- Viewer filters panel / sidebar -->
    <v-navigation-drawer
      v-model="drawer"
      class="viewer-controls-drawer"
      app
      floating
      disable-resize-watcher
      style="z-index: 10000"
    >
      <div class="px-1 pt-1 d-flex flex-column" style="height: 100%; width: 100%">
        <!-- Drawer closer -->
        <v-btn icon small class="align-self-end mb-2" @click="drawer = false">
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>

        <!-- Views display -->
        <views-display v-if="views.length !== 0" :views="views" :sticky-top="false" />

        <!-- Filters display -->
        <viewer-filters
          :props="objectProperties"
          style="width: 100%"
          :sticky-top="false"
        />
      </div>
    </v-navigation-drawer>

    <!-- Actual viewer -->
    <div style="position: fixed" class="viewer-wrapper no-scrollbar fullscreen">
      <speckle-viewer @load-progress="captureProgress" @viewer-init="onViewerInit" />
    </div>
  </div>
</template>
<script lang="ts">
import { Nullable } from '@/helpers/typeHelpers'
import Vue from 'vue'
import SpeckleViewer from '@/main/components/common/SpeckleViewer.vue'
import ViewerControls from '@/main/components/viewer/ViewerControls.vue'
import ViewsDisplay from '@/main/components/viewer/ViewsDisplay.vue'
import ViewerFilters from '@/main/components/viewer/ViewerFilters.vue'

/**
 * Core embed viewer functionality with all of the heavy JS dependencies has been extracted to this component,
 * so that we can lazy-load it only when the user clicks on the "play" button
 *
 * Make sure this component isn't initialized until it's actually needed and don't put any heavy deps
 * inside EmbedViewer.vue (or asynchronize them)
 */

type UnknownObject = Record<string, unknown>

export default Vue.extend({
  name: 'EmbedViewerCore',
  components: {
    SpeckleViewer,
    ViewerControls,
    ViewsDisplay,
    ViewerFilters
  },
  props: {
    objects: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      error: null as Nullable<Error>,
      drawer: false,
      loadedModel: false,
      loadProgress: 0,
      views: [] as Array<UnknownObject>,
      objectProperties: null as Nullable<UnknownObject>
    }
  },
  computed: {
    goToServerUrl(): string {
      const base = `${window.location.origin}/streams/${this.$route.query.stream}/`

      if (this.$route.query.commit) return base + `commits/${this.$route.query.commit}`

      if (this.$route.query.object) return base + `objects/${this.$route.query.object}`

      if (this.$route.query.branch)
        return base + `branches/${encodeURI(this.$route.query.branch)}`

      return base
    }
  },
  watch: {
    error(newVal: Error | null) {
      if (newVal) this.$emit('error', newVal)
    }
  },
  methods: {
    captureProgress(args: { progress: number; id: number; url: string }) {
      this.loadProgress = args.progress * 100
    },
    markModelLoaded() {
      this.loadedModel = true
      this.$emit('model-loaded')
    },
    async onViewerInit() {
      if (!window.__viewer) {
        throw new Error('Viewer instance unavailable')
      }

      for (const id of this.objects)
        await window.__viewer.loadObject(
          `${window.location.origin}/streams/${this.$route.query.stream}/objects/${id}`
        )

      window.__viewer.zoomExtents(undefined, true)

      this.markModelLoaded()

      this.views.push(...window.__viewer.sceneManager.views)
      this.objectProperties = await window.__viewer.getObjectsProperties()

      if (this.$route.query.filter) {
        const parsedFilter = JSON.parse(this.$route.query.filter as string)
        setTimeout(() => {
          this.$store.commit('setFilterDirect', { filter: parsedFilter })
        }, 1000)
      }

      if (this.$route.query.c) {
        const cam = JSON.parse(this.$route.query.c as string)
        window.__viewer.interactions.setLookAt(
          { x: cam[0], y: cam[1], z: cam[2] }, // position
          { x: cam[3], y: cam[4], z: cam[5] } // target
        )
      }
    }
  }
})
</script>
<style lang="scss">
.embed-viewer-core {
  position: relative;
  width: 100%;
  height: 100%;

  .fullscreen {
    height: 100vh !important;
    width: 100vw !important;
    position: fixed;

    &::-webkit-scrollbar {
      display: none;
    }

    top: 0;
    left: 0;
<<<<<<< HEAD
    z-index: 1;
=======
    z-index: 10;
>>>>>>> main
  }

  .no-scrollbar {
    width: 100vw;
    height: 100vh;
    overflow: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
