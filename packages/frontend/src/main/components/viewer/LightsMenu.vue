<template>
  <v-card>
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
import { useInjectedViewer } from '@/main/lib/viewer/core/composables/viewer'
import { reactive } from 'vue'
export default {
  setup() {
    const config = reactive({ ...DefaultLightConfiguration })
    const { viewer } = useInjectedViewer()
    return {
      viewer,
      config
    }
  },
  watch: {
    config: {
      deep: true,
      handler(newVal) {
        this.viewer.setLightConfiguration(newVal)
      }
    }
  }
}
</script>
