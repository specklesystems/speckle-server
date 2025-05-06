<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <ViewerMenu v-model:open="open" tooltip="View modes">
    <template #trigger-icon>
      <IconViewModes class="h-5 w-5" />
    </template>
    <template #title>View modes</template>
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
          :description="shortcut.description"
          :active="isActiveMode(shortcut.viewMode)"
          :shortcut="getShortcutDisplayText(shortcut, { hideName: true })"
          @click="handleViewModeChange(shortcut.viewMode)"
        />
      </div>
    </div>
    <div
      class="border-t border-b border-outline-2 p-2 flex items-center justify-between"
      :class="{ 'border-b': showEdges }"
    >
      <span class="text-body-2xs font-medium text-foreground leading-none">Edges</span>
      <div
        v-tippy="
          currentViewMode === ViewMode.PEN
            ? 'Edges are always enabled in Pen mode'
            : undefined
        "
      >
        <FormSwitch
          v-model="showEdges"
          :show-label="false"
          name="toggle-edges"
          class="text-body-2xs"
          :disabled="currentViewMode === ViewMode.PEN"
        />
      </div>
    </div>
    <div v-if="showEdges" class="p-2 pt-1.5">
      <div>
        <div class="flex items-center justify-between gap-2">
          <div class="text-body-2xs">Line width</div>
          <FormButton
            color="subtle"
            size="sm"
            :icon-right="showLineWidthSlider ? ChevronUpIcon : ChevronDownIcon"
            class="!text-foreground-2 !pr-0"
            @click="showLineWidthSlider = !showLineWidthSlider"
          >
            {{ edgeStroke }}
          </FormButton>
        </div>
        <input
          v-show="showLineWidthSlider"
          id="edge-stroke"
          v-model="edgeStroke"
          class="w-full mt-1"
          type="range"
          name="edge-stroke"
          :min="0.5"
          :max="3"
          step="0.1"
          :disabled="!showLineWidthSlider"
        />
        <div class="flex items-center justify-between gap-2 mt-1.5 pr-0.5">
          <div class="text-body-2xs">Color</div>
          <div v-tippy="`Coming soon`" class="flex items-center gap-1 opacity-60">
            <div
              class="w-3 h-3 rounded-full bg-foundation border-[1.5px] border-foreground-2 opacity-80"
            />
            <div
              class="w-3 h-3 rounded-full bg-[#98FB98] border-[1.5px] border-outline-2"
            />
            <div
              class="w-3 h-3 rounded-full bg-[#87CEEB] border-[1.5px] border-outline-2"
            />
            <div
              class="w-3 h-3 rounded-full bg-[#FFB6C1] border-[1.5px] border-outline-2"
            />
          </div>
        </div>
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
import { FormSwitch } from '@speckle/ui-components'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'

const open = defineModel<boolean>('open', { default: false })

const { setViewMode, currentViewMode } = useViewModeUtilities()
const { getShortcutDisplayText, registerShortcuts } = useViewerShortcuts()
const mp = useMixpanel()

const isManuallyOpened = ref(false)
const showEdges = ref(true)
const edgeStroke = ref(1)
const showLineWidthSlider = ref(false)

const { start: startCloseTimer, stop: cancelCloseTimer } = useTimeoutFn(
  () => {
    open.value = false
  },
  3000,
  { immediate: false }
)

registerShortcuts({
  SetViewModeDefault: () => handleViewModeChange(ViewMode.DEFAULT, true),
  SetViewModeSolid: () => handleViewModeChange(ViewMode.SOLID, true),
  SetViewModePen: () => handleViewModeChange(ViewMode.PEN, true),
  SetViewModeArctic: () => handleViewModeChange(ViewMode.ARCTIC, true),
  SetViewModeShaded: () => handleViewModeChange(ViewMode.SHADED, true)
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

onUnmounted(() => {
  cancelCloseTimer()
})

watch(currentViewMode, (newMode) => {
  if (newMode === ViewMode.PEN) {
    showEdges.value = true
  }
})
</script>
