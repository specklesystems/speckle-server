<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <ViewerMenu v-model:open="open" tooltip="Views">
    <template #trigger-icon>
      <IconViews class="w-5 h-5" />
    </template>
    <template #title>Views</template>
    <div
      class="w-32 sm:w-40 max-h-64 simple-scrollbar overflow-y-auto flex flex-col p-1.5"
      @mouseenter="cancelCloseTimer"
      @mouseleave="isManuallyOpened ? undefined : startCloseTimer"
      @focusin="cancelCloseTimer"
      @focusout="isManuallyOpened ? undefined : startCloseTimer"
    >
      <div v-for="shortcut in viewShortcuts" :key="shortcut.name">
        <ViewerMenuItem
          :label="shortcut.name"
          hide-active-tick
          :active="activeView === shortcut.name.toLowerCase()"
          :shortcut="getShortcutDisplayText(shortcut, { hideName: true })"
          @click="handleViewChange(shortcut.name.toLowerCase() as CanonicalView)"
        />
      </div>

      <div v-if="views.length !== 0" class="w-full border-b my-1"></div>

      <ViewerMenuItem
        v-for="view in views"
        :key="view.id"
        hide-active-tick
        :active="activeView === view.id"
        :label="view.name ? view.name : view.id"
        @click="handleViewChange(view)"
      />
    </div>
  </ViewerMenu>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import type { CanonicalView, SpeckleView } from '@speckle/viewer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useCameraUtilities, useViewerShortcuts } from '~~/lib/viewer/composables/ui'
import { ViewShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'
import { useViewerCameraControlEndTracker } from '~~/lib/viewer/composables/viewer'

const {
  viewer: {
    metadata: { views }
  }
} = useInjectedViewerState()
const { setView: setViewRaw } = useCameraUtilities()
const { getShortcutDisplayText, registerShortcuts } = useViewerShortcuts()
const mp = useMixpanel()

const open = defineModel<boolean>('open', { default: false })
const isManuallyOpened = ref(false)
const activeView = ref<string | null>(null)

// Clear active view when camera control ends
useViewerCameraControlEndTracker(() => {
  activeView.value = null
})

const { start: startCloseTimer, stop: cancelCloseTimer } = useTimeoutFn(
  () => {
    open.value = false
  },
  3000,
  { immediate: false }
)

const handleViewChange = (v: CanonicalView | SpeckleView, isShortcut = false) => {
  setViewRaw(v)
  cancelCloseTimer()
  activeView.value = typeof v === 'string' ? v : v.id

  if (isShortcut) {
    emit('force-close-others')
    open.value = true
    startCloseTimer()
  }

  mp.track('Viewer Action', {
    type: 'action',
    name: 'set-view',
    view: (v as SpeckleView)?.name || v
  })
}

registerShortcuts({
  SetViewTop: () => handleViewChange('top', true),
  SetViewFront: () => handleViewChange('front', true),
  SetViewLeft: () => handleViewChange('left', true),
  SetViewBack: () => handleViewChange('back', true),
  SetViewRight: () => handleViewChange('right', true)
})

const viewShortcuts = Object.values(ViewShortcuts)

const emit = defineEmits<{
  (e: 'force-close-others'): void
}>()

onUnmounted(() => {
  cancelCloseTimer()
})
</script>
