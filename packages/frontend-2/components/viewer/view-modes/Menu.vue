<template>
  <div ref="menuWrapper" class="relative z-30">
    <ViewerControlsButtonToggle flat secondary :active="open" @click="open = !open">
      icon
    </ViewerControlsButtonToggle>
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="absolute translate-x-0 w-32 left-10 sm:left-12 -top-0 sm:-top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto outline outline-2 outline-primary-muted rounded-lg shadow-lg overflow-hidden flex flex-col"
      >
        <!-- View modes -->
        <div v-for="mode in viewModesList" :key="mode.name">
          <button
            class="hover:bg-primary-muted text-foreground w-full h-full text-body-xs py-1 transition"
            :class="{ 'bg-primary-muted': isActiveMode(mode.mode) }"
            @click="setViewMode(mode.mode)"
          >
            {{ mode.name }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ViewMode } from '@speckle/viewer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useCameraUtilities } from '~~/lib/viewer/composables/ui'
import { onClickOutside } from '@vueuse/core'

const { setViewMode: setViewModeRaw, currentViewMode } = useCameraUtilities()
const mp = useMixpanel()

const open = ref(false)
const menuWrapper = ref(null)

const viewModesList = [
  { name: 'Default', mode: ViewMode.DEFAULT },
  { name: 'Default + Edges', mode: ViewMode.DEFAULT_EDGES },
  { name: 'Shaded', mode: ViewMode.SHADED },
  { name: 'Pen', mode: ViewMode.PEN },
  { name: 'Arctic', mode: ViewMode.ARCTIC }
]

const isActiveMode = (mode: ViewMode) => currentViewMode.value === mode

const setViewMode = (mode: ViewMode) => {
  setViewModeRaw(mode)
  open.value = false
  mp.track('Viewer Action', {
    type: 'action',
    name: 'set-view-mode',
    mode
  })
}

onClickOutside(menuWrapper, () => {
  open.value = false
})
</script>
