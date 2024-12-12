<template>
  <ViewerMenu
    v-model:open="open"
    v-tippy="isSmallerOrEqualSm ? undefined : 'Explode'"
    tooltip="Explode model"
  >
    <template #trigger-icon>
      <IconExplode
        class="h-4 w-4 sm:h-5 sm:w-5"
        :class="{ 'text-foreground-2': !isActive }"
      />
    </template>
    <div class="w-56 p-2 flex flex-col space-y-2">
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
        <label class="text-body-xs text-foreground-2" for="intensity">Intensity</label>
      </div>
    </div>
  </ViewerMenu>
</template>

<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'

const open = defineModel<boolean>('open', { required: true })

const {
  ui: { explodeFactor }
} = useInjectedViewerState()

const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const isActive = computed(() => {
  return explodeFactor.value > 0.01
})

const mp = useMixpanel()
watch(explodeFactor, (val) => {
  mp.track('Viewer Action', { type: 'action', name: 'explode', value: val })
})
</script>
