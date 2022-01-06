<template>
  <v-card class="transparent elevation-5 rounded-md overflow-hidden d-inline-block">
    <v-btn
      v-show="showVisReset"
      v-tooltip="`Resets all applied filters`"
      :zzzdisabled="!showVisReset"
      tile
      small
      @click="resetVisibility()"
    >
      <v-icon small class="mr-2">mdi-eye</v-icon>
      Show All
    </v-btn>
    <v-btn
      v-tooltip="`Toggle between perspective or ortho camera.`"
      tile
      small
      @click="toggleCamera()"
    >
      <v-icon small>mdi-perspective-less</v-icon>
    </v-btn>
    <v-btn tile small @click="zoomEx()">
      <v-icon small>mdi-cube-scan</v-icon>
    </v-btn>
    <v-btn tile small @click="sectionToggle()">
      <v-icon small>mdi-scissors-cutting</v-icon>
    </v-btn>
    <v-btn tile small @click="fullScreen = !fullScreen">
      <v-icon small>{{ fullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
    </v-btn>
    <v-btn v-tooltip="'Overlay another commit'" tile small color="primary">
      <v-icon small>mdi-plus</v-icon>
    </v-btn>
    <!-- <v-btn tile color="primary" small @click="sectionToggle()">
      <v-icon small class="mr-2">mdi-comment-outline</v-icon>
      Comments
    </v-btn> -->
  </v-card>
</template>
<script>
export default {
  props: {
    small: { type: Boolean, default: false }
  },
  data() {
    return {
      fullScreen: false,
      showVisReset: false
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
      window.__viewer.applyFilter(null)
      this.showVisReset = false
      this.$eventHub.$emit('visibility-reset')
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
