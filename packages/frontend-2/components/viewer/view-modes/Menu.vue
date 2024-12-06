<template>
  <div ref="menuWrapper" class="relative z-30">
    <ViewerControlsButtonToggle
      v-tippy="`View modes`"
      flat
      secondary
      :active="open"
      @click="open = !open"
    >
      <IconViewModes class="h-5 w-5" />
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
        class="absolute translate-x-0 w-56 left-10 sm:left-12 -top-0 sm:-top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto rounded-lg shadow-md flex flex-col p-1.5"
      >
        <div v-for="shortcut in viewModeShortcuts" :key="shortcut.name">
          <button
            class="flex items-center justify-between hover:bg-highlight-1 text-foreground w-full h-full text-body-xs py-1 px-2 transition rounded-md"
            :class="{ 'bg-highlight-1': isActiveMode(shortcut.viewMode) }"
            @click="handleViewModeChange(shortcut.viewMode)"
          >
            <div class="w-5 shrink-0">
              <CheckIcon v-if="isActiveMode(shortcut.viewMode)" class="h-3 w-3" />
            </div>
            <div class="flex-1 text-left">{{ shortcut.name }}</div>
            <span class="text-body-2xs text-foreground-2">
              {{ getShortcutDisplayText(shortcut) }}
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ViewMode } from '@speckle/viewer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useViewerShortcuts, useViewModeUtilities } from '~~/lib/viewer/composables/ui'
import { onClickOutside } from '@vueuse/core'
import { ViewModeShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'
import { CheckIcon } from '@heroicons/vue/24/solid'

const { setViewMode, currentViewMode } = useViewModeUtilities()
const { getShortcutDisplayText, registerShortcuts } = useViewerShortcuts()
const mp = useMixpanel()

registerShortcuts({
  SetViewModeDefault: () => handleViewModeChange(ViewMode.DEFAULT),
  SetViewModeDefaultEdges: () => handleViewModeChange(ViewMode.DEFAULT_EDGES),
  SetViewModeShaded: () => handleViewModeChange(ViewMode.SHADED),
  SetViewModePen: () => handleViewModeChange(ViewMode.PEN),
  SetViewModeArctic: () => handleViewModeChange(ViewMode.ARCTIC)
})

const open = ref(false)
const menuWrapper = ref(null)

const isActiveMode = (mode: ViewMode) => mode === currentViewMode.value

const viewModeShortcuts = Object.values(ViewModeShortcuts)

const handleViewModeChange = (mode: ViewMode) => {
  setViewMode(mode)
  open.value = true
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
