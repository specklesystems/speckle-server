<template>
  <div>
    <v-card
      class="elevation-5 rounded-xl pl-3 py-0 d-flex align-center"
      height="44"
      style="max-width: 90vw; overflow-x: auto; overflow-y: hidden"
    >
      <v-btn
        v-show="showVisReset"
        v-tooltip="`Resets all applied color and visibility filters`"
        x-small
        rounded
        class="mr-2 primary"
        @click="resetVisibility()"
      >
        <v-icon small class="mr-2">mdi-eye-off</v-icon>
        Reset Filters
      </v-btn>
      <v-btn
        v-tooltip="'Viewer Help'"
        :small="small"
        rounded
        icon
        class="mr-2"
        @click="helpDialog = true"
      >
        <v-icon small>mdi-help</v-icon>
      </v-btn>
      <v-dialog v-model="helpDialog" max-width="600">
        <viewer-help @close="helpDialog = false" />
      </v-dialog>
      <!-- disabling ortho mode because comment intersection are f*ed. -->
      <v-btn
        v-tooltip="`between perspective or ortho camera.`"
        :small="small"
        rounded
        icon
        class="mr-2"
        @click="toggleCamera()"
      >
        <v-icon small>mdi-perspective-less</v-icon>
      </v-btn>
      <v-menu
        :close-on-content-click="false"
        origin="center"
        rounded="lg"
        open-on-hover
        top
        offset-y
        close-delay="400"
        nudge-top="10"
        nudge-left="100"
        nudge-width="200"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            v-tooltip="'Sun & Shadow Settings'"
            :small="small"
            rounded
            icon
            class="mr-2"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon small>mdi-white-balance-sunny</v-icon>
          </v-btn>
        </template>
        <lights-menu />
      </v-menu>
      <canonical-views :small="small" />
      <v-btn
        v-tooltip="'Zoom extents'"
        :small="small"
        rounded
        icon
        class="mr-2"
        @click="zoomEx()"
      >
        <v-icon small>mdi-arrow-expand</v-icon>
      </v-btn>
      <v-btn
        v-tooltip="`Toggle section box`"
        :small="small"
        rounded
        icon
        :class="`mr-2 ${viewerState.sectionBox ? 'primary elevation-2' : ''}`"
        @click="sectionToggle()"
      >
        <v-icon small :class="`${viewerState.sectionBox ? 'white--text' : ''}`">
          mdi-scissors-cutting
        </v-icon>
      </v-btn>
      <!-- Other components teleport extra controls in here -->
      <portal-target
        name="viewercontrols"
        class="d-flex align-center"
        multiple
      ></portal-target>
    </v-card>
  </div>
</template>
<script>
import { useInjectedViewer } from '@/main/lib/viewer/core/composables/viewer'
import { useQuery } from '@vue/apollo-composable'
import { computed, ref } from 'vue'
import gql from 'graphql-tag'
import {
  resetFilter,
  toggleSectionBox,
  setSectionBox,
  setSectionBoxFromObjects
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
export default {
  components: {
    CanonicalViews: () => import('@/main/components/viewer/CanonicalViews'),
    ViewerHelp: () => import('@/main/components/viewer/dialogs/ViewerHelp.vue'),
    LightsMenu: () => import('@/main/components/viewer/LightsMenu.vue')
  },
  props: {
    small: { type: Boolean, default: false }
  },
  setup() {
    const { viewer } = useInjectedViewer()
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          # appliedFilter
          currentFilterState
          selectedObjects
          sectionBox
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    const helpDialog = ref(false)
    const lightsDialog = ref(false)
    return { viewer, viewerState, helpDialog, lightsDialog }
  },
  data() {
    return {
      fullScreen: false
    }
  },
  computed: {
    showVisReset() {
      return !!this.viewerState.currentFilterState
    }
  },
  mounted() {
    this.$eventHub.$on('show-visreset', (state) => (this.showVisReset = state))
    this.sectionBoxIsOn = this.viewer.getCurrentSectionBox() !== null
  },
  methods: {
    toggleCamera() {
      this.viewer.toggleCameraProjection()
    },
    resetVisibility() {
      resetFilter()
    },
    zoomEx() {
      this.viewer.zoom()
    },
    sectionToggle() {
      if (this.viewerState.selectedObjects.length !== 0) {
        setSectionBoxFromObjects(this.viewerState.selectedObjects.map((o) => o.id))
      } else {
        setSectionBox()
      }

      toggleSectionBox()
    }
  }
}
</script>
<style scoped>
.abs {
  position: fixed;
  right: 10px;
  bottom: 10px;
}
</style>
