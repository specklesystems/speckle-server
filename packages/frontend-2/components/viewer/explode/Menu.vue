<template>
  <ViewerLayoutPanel>
    <div class="px-3 pt-2.5 pb-4 flex flex-col gap-y-3">
      <div class="flex items-center justify-between">
        <label class="text-body-2xs" for="intensity">Intensity</label>
        <span class="text-body-2xs">{{ explodeFactor }}</span>
      </div>
      <div class="flex items-center space-x-1">
        <input
          id="intensity"
          v-model="explodeFactor"
          class="w-24 sm:w-32 h-2"
          type="range"
          name="intensity"
          min="0"
          max="1"
          step="0.01"
        />
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
