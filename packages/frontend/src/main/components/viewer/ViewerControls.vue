<template>
  <div>
    <v-card class="transparent elevation-0">
      <v-btn
        v-show="showVisReset"
        v-tooltip="`Resets all applied filters`"
        :zzzdisabled="!showVisReset"
        :small="small"
        rounded
        icon
        class="mr-2"
        @click="resetVisibility()"
      >
        <v-icon small class="mr-2">mdi-eye</v-icon>
        Reset Filters
      </v-btn>
      <v-btn
        v-tooltip="`Toggle between perspective or ortho camera.`"
        :small="small"
        rounded
        icon
        class="mr-2"
        @click="toggleCamera()"
      >
        <v-icon small>mdi-perspective-less</v-icon>
      </v-btn>
      <canonical-views :small="small" />
      <v-btn v-tooltip="'Zoom extents'" :small="small" rounded icon class="mr-2" @click="zoomEx()">
        <v-icon small>mdi-arrow-expand</v-icon>
      </v-btn>
      <v-btn
        v-tooltip="`Toggle section box`"
        :small="small"
        rounded
        icon
        class="mr-2"
        @click="sectionToggle()"
      >
        <v-icon small>mdi-scissors-cutting</v-icon>
      </v-btn>
      <portal-target slim name="viewercontrols"></portal-target>
    </v-card>
  </div>
</template>
<script>
export default {
  components: {
    CanonicalViews: () => import('@/main/components/viewer/CanonicalViews')
  },
  props: {
    small: { type: Boolean, default: false }
  },
  data() {
    return {
      fullScreen: false
    }
  },
  computed: {
    showVisReset() {
      return !!this.$store.state.appliedFilter
    }
  },
  mounted() {
    this.$eventHub.$on('show-visreset', (state) => (this.showVisReset = state))
  },
  methods: {
    toggleCamera() {
      window.__viewer.toggleCameraProjection()
    },
    resetVisibility() {
      this.$store.commit('resetFilter')
    },
    zoomEx() {
      window.__viewer.zoomExtents()
    },
    sectionToggle() {
      window.__viewer.toggleSectionBox()
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
