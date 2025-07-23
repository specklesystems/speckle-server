<template>
  <ViewerLayoutPanel>
    <div class="w-56 px-2 py-2.5 flex flex-col space-y-2">
      <div class="flex items-center space-x-1">
        <input
          id="intensity"
          v-model="explodeFactor"
          class="w-24 sm:w-32 h-2 mr-2"
          type="range"
          name="intensity"
          min="0"
          max="1"
          step="0.01"
        />
        <label class="text-body-2xs" for="intensity">Intensity</label>
      </div>
    </div>
  </ViewerLayoutPanel>
</template>

<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

const {
  ui: { explodeFactor }
} = useInjectedViewerState()

const mp = useMixpanel()
watch(explodeFactor, (val) => {
  mp.track('Viewer Action', { type: 'action', name: 'explode', value: val })
})
</script>
