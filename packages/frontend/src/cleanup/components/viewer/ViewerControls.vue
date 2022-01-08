<template>
  <div>
    <v-card
      class="transparent elevation-0 rounded-md d-inline-block flex-grow-1 justify-center text-center"
    >
      <v-btn
        v-show="showVisReset"
        v-tooltip="`Resets all applied filters`"
        :zzzdisabled="!showVisReset"
        xxxtile
        :small="small"
        rounded
        class="mr-2"
        @click="resetVisibility()"
      >
        <v-icon small class="mr-2">mdi-eye</v-icon>
        Show All
      </v-btn>
      <v-btn
        v-tooltip="`Toggle between perspective or ortho camera.`"
        xxxtile
        :small="small"
        rounded
        class="mr-2"
        @click="toggleCamera()"
      >
        <v-icon small>mdi-perspective-less</v-icon>
      </v-btn>
      <v-btn xxxtile :small="small" rounded class="mr-2" @click="zoomEx()">
        <v-icon small>mdi-cube-scan</v-icon>
      </v-btn>
      <v-btn
        v-tooltip="`Toggle section box`"
        xxxtile
        :small="small"
        rounded
        class="mr-2"
        @click="sectionToggle()"
      >
        <v-icon small>mdi-scissors-cutting</v-icon>
      </v-btn>
      <v-btn
        v-tooltip="'Overlay another commit or object'"
        xxxtile
        color="primary"
        :small="small"
        rounded
        class="mr-2"
        @click="$emit('show-add-overlay')"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-card>
  </div>
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
<style scoped>
.abs {
  position: fixed;
  right: 10px;
  bottom: 10px;
}
</style>
