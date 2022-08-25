<template>
  <v-card>
    <!-- <v-toolbar dark flat>
      <v-toolbar-title>Lighting Settings</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar> -->
    <v-card-text>
      <div class="d-flex align-center">
        <span class="mr-5">Sun shadows</span>
        <v-switch v-model="config.enabled" inset :label="``" />
      </div>
      <v-slider
        v-model="config.intensity"
        step="0"
        max="10"
        min="1"
        :thumb-size="24"
        label="Sun intensity"
        :disabled="!config.enabled"
      />
      <v-slider
        v-model="config.elevation"
        step="0"
        :min="0"
        :max="Math.PI"
        :thumb-size="24"
        label="Sun elevation"
        :disabled="!config.enabled"
      />
      <v-slider
        v-model="config.azimuth"
        step="0"
        :min="-Math.PI * 0.5"
        :max="Math.PI * 0.5"
        :thumb-size="24"
        label="Sun azimuth"
        :disabled="!config.enabled"
      />
      <v-slider
        v-model="config.indirectLightIntensity"
        step="0"
        min="0.0"
        max="5.0"
        :thumb-size="24"
        label="Indirect light"
      />
    </v-card-text>
  </v-card>
</template>
<script>
import { DefaultLightConfiguration } from '@speckle/viewer'
import { getInitializedViewer } from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { reactive } from 'vue'
export default {
  setup() {
    const config = reactive({ ...DefaultLightConfiguration })
    return {
      config
    }
  },
  watch: {
    config: {
      deep: true,
      handler(newVal) {
        getInitializedViewer().setLightConfiguration(newVal)
      }
    }
  }
}
</script>
