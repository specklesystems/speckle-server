<template>
  <div class="relative z-30">
    <Popover as="div" class="relative z-30">
      <PopoverButton v-slot="{ open }" as="template">
        <ViewerControlsButtonToggle flat secondary :active="open || isActive">
          <!-- <ChevronUpDownIcon class="w-5 h-5 rotate-45" /> -->
          <IconExplode class="h-4 w-4 sm:h-5 sm:w-5" />
        </ViewerControlsButtonToggle>
      </PopoverButton>
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <PopoverPanel
          class="absolute translate-x-0 left-12 top-0 p-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto outline outline-2 outline-primary-muted rounded-lg shadow-lg overflow-hidden flex flex-col space-y-2"
        >
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
            <label class="text-body-xs text-foreground-2" for="intensity">
              Intensity
            </label>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  </div>
</template>
<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { useMixpanel } from '~~/lib/core/composables/mp'
// import { ChevronUpDownIcon } from '@heroicons/vue/24/outline'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

const {
  ui: { explodeFactor }
} = useInjectedViewerState()

const isActive = computed(() => {
  return explodeFactor.value > 0.01
})

const mp = useMixpanel()
watch(explodeFactor, (val) => {
  mp.track('Viewer Action', { type: 'action', name: 'explode', value: val })
})
</script>
