<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
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
        v-keyboard-clickable
        class="absolute translate-x-0 w-56 left-10 sm:left-12 -top-0 sm:-top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto rounded-lg shadow-md flex flex-col p-1.5"
        @mouseenter="cancelCloseTimer"
        @focusin="cancelCloseTimer"
      >
        <div v-for="shortcut in viewModeShortcuts" :key="shortcut.name">
          <button
            class="flex items-center justify-between hover:bg-highlight-1 text-foreground w-full h-full text-body-xs py-1 px-2 transition rounded-md"
            :class="{ 'bg-highlight-1': isActiveMode(shortcut.viewMode) }"
            @click="handleViewModeChange(shortcut.viewMode)"
          >
            <div class="w-5 shrink-0">
              <IconCheck
                v-if="isActiveMode(shortcut.viewMode)"
                class="h-4 w-4 text-foreground-2"
              />
            </div>
            <div class="flex-1 text-left">{{ shortcut.name }}</div>
            <span class="text-body-2xs text-foreground-2">
              {{ getShortcutDisplayText(shortcut, { hideName: true }) }}
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

const open = defineModel<boolean>('open', { required: true })

const { setViewMode, currentViewMode } = useViewModeUtilities()
const { getShortcutDisplayText, registerShortcuts } = useViewerShortcuts()
const mp = useMixpanel()

registerShortcuts({
  SetViewModeDefault: () => handleViewModeChange(ViewMode.DEFAULT, true),
  SetViewModeDefaultEdges: () => handleViewModeChange(ViewMode.DEFAULT_EDGES, true),
  SetViewModeShaded: () => handleViewModeChange(ViewMode.SHADED, true),
  SetViewModePen: () => handleViewModeChange(ViewMode.PEN, true),
  SetViewModeArctic: () => handleViewModeChange(ViewMode.ARCTIC, true)
})

const menuWrapper = ref(null)
const isManuallyOpened = ref(false)
const closeTimer = ref<NodeJS.Timeout | null>(null)

const isActiveMode = (mode: ViewMode) => mode === currentViewMode.value

const viewModeShortcuts = Object.values(ViewModeShortcuts)

const handleViewModeChange = (mode: ViewMode, isShortcut = false) => {
  setViewMode(mode)
  if (isShortcut) {
    open.value = true
    startCloseTimer()
  } else {
    isManuallyOpened.value = true
    cancelCloseTimer()
  }
  mp.track('Viewer Action', {
    type: 'action',
    name: 'set-view-mode',
    mode
  })
}

const cancelCloseTimer = () => {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
}

const startCloseTimer = () => {
  if (!isManuallyOpened.value) {
    closeTimer.value = setTimeout(() => {
      open.value = false
    }, 3000)
  }
}

onClickOutside(menuWrapper, () => {
  open.value = false
  isManuallyOpened.value = false
})

onUnmounted(() => {
  cancelCloseTimer()
})
</script>
