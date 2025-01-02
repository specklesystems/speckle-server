<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <ViewerMenu v-model:open="open" tooltip="View modes">
    <template #trigger-icon>
      <IconViewModes class="h-5 w-5" />
    </template>
    <div
      class="w-56 p-1.5"
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
      <ViewerMenuItem
        label="Let it snow"
        :active="snowingEnabled"
        @click="onSnowModeClick"
      >
        ❄️
      </ViewerMenuItem>
    </div>
  </ViewerMenu>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { ViewMode } from '@speckle/viewer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useViewerShortcuts, useViewModeUtilities } from '~~/lib/viewer/composables/ui'
import { ViewModeShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'

const open = defineModel<boolean>('open', { default: false })

const { setViewMode, currentViewMode, letItSnow } = useViewModeUtilities()
const { getShortcutDisplayText, registerShortcuts } = useViewerShortcuts()
const mp = useMixpanel()

const isManuallyOpened = ref(false)

const { start: startCloseTimer, stop: cancelCloseTimer } = useTimeoutFn(
  () => {
    open.value = false
  },
  3000,
  { immediate: false }
)

registerShortcuts({
  SetViewModeDefault: () => handleViewModeChange(ViewMode.DEFAULT, true),
  SetViewModeDefaultEdges: () => handleViewModeChange(ViewMode.DEFAULT_EDGES, true),
  SetViewModeShaded: () => handleViewModeChange(ViewMode.SHADED, true),
  SetViewModePen: () => handleViewModeChange(ViewMode.PEN, true),
  SetViewModeArctic: () => handleViewModeChange(ViewMode.ARCTIC, true),
  SetViewModeColors: () => handleViewModeChange(ViewMode.COLORS, true)
})

const isActiveMode = (mode: ViewMode) =>
  snowingEnabled.value ? false : mode === currentViewMode.value

const viewModeShortcuts = Object.values(ViewModeShortcuts)
const snowingEnabled = ref(false)

const emit = defineEmits<{
  (e: 'force-close-others'): void
}>()

const handleViewModeChange = (mode: ViewMode, isShortcut = false) => {
  snowingEnabled.value = false
  setViewMode(mode)
  cancelCloseTimer()

  if (isShortcut) {
    emit('force-close-others')
    open.value = true
    startCloseTimer()
  }

  mp.track('Viewer Action', {
    type: 'action',
    name: 'set-view-mode',
    mode
  })
}

const onSnowModeClick = () => {
  snowingEnabled.value = true
  letItSnow()
}

onUnmounted(() => {
  cancelCloseTimer()
})
</script>
