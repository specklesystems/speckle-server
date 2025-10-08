<template>
  <ViewerLayoutPanel>
    <div class="p-3 flex flex-col gap-y-3">
      <FormRange
        v-model="explodeFactor"
        name="intensity"
        label="Intensity"
        :min="0"
        :max="1"
        :step="0.01"
      />
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
