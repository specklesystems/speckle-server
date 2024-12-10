<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <ViewerMenu v-model:open="open" tooltip="View modes">
    <template #trigger-icon>
      <IconViewModes class="h-5 w-5" />
    </template>
    <div
      @mouseenter="cancelCloseTimer"
      @mouseleave="isManuallyOpened ? undefined : startCloseTimer"
      @focusin="cancelCloseTimer"
      @focusout="isManuallyOpened ? undefined : startCloseTimer"
    >
      <div v-for="shortcut in viewModeShortcuts" :key="shortcut.name">
        <ViewerMenuItem
          :label="shortcut.name"
          :active="isActiveMode(shortcut.viewMode)"
          :shortcut="getShortcutDisplayText(shortcut, { hideName: true })"
          @click="handleViewModeChange(shortcut.viewMode)"
        />
      </div>
    </div>
  </ViewerMenu>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { ViewMode } from '@speckle/viewer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useViewerShortcuts, useViewModeUtilities } from '~~/lib/viewer/composables/ui'
import { ViewModeShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'

const emit = defineEmits<{
  'shortcut-open': []
}>()

const open = defineModel<boolean>('open', { required: true })

const { setViewMode, currentViewMode } = useViewModeUtilities()
const { getShortcutDisplayText, registerShortcuts } = useViewerShortcuts()
const mp = useMixpanel()

const isManuallyOpened = ref(false)

const { start: startCloseTimer, stop: cancelCloseTimer } = useTimeoutFn(
  () => {
    if (!isManuallyOpened.value) {
      open.value = false
    }
  },
  3000,
  { immediate: false }
)

registerShortcuts({
  SetViewModeDefault: () => handleViewModeChange(ViewMode.DEFAULT, true),
  SetViewModeDefaultEdges: () => handleViewModeChange(ViewMode.DEFAULT_EDGES, true),
  SetViewModeShaded: () => handleViewModeChange(ViewMode.SHADED, true),
  SetViewModePen: () => handleViewModeChange(ViewMode.PEN, true),
  SetViewModeArctic: () => handleViewModeChange(ViewMode.ARCTIC, true)
})

const isActiveMode = (mode: ViewMode) => mode === currentViewMode.value
const viewModeShortcuts = Object.values(ViewModeShortcuts)

const handleViewModeChange = (mode: ViewMode, isShortcut = false) => {
  setViewMode(mode)

  if (isShortcut) {
    isManuallyOpened.value = false
    emit('shortcut-open')
    cancelCloseTimer()
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

onUnmounted(() => {
  cancelCloseTimer()
})
</script>
