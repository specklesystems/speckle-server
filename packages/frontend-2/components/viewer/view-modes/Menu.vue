<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <ViewerLayoutPanel>
    <div class="w-full p-1.5">
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
    <div class="border-t border-outline-2 p-2 flex items-center justify-between">
      <span class="text-body-2xs font-medium text-foreground leading-none">Edges</span>
      <div
        v-tippy="
          currentViewMode === ViewMode.PEN
            ? 'Edges are always enabled in Pen mode'
            : undefined
        "
      >
        <FormSwitch
          :model-value="edgesEnabled"
          :show-label="false"
          name="toggle-edges"
          class="text-body-2xs"
          :disabled="currentViewMode === ViewMode.PEN"
          @update:model-value="toggleEdgesEnabled"
        />
      </div>
    </div>
    <div v-if="edgesEnabled" class="p-2 pt-1.5">
      <div>
        <div class="flex items-center justify-between gap-2">
          <div class="text-body-2xs">Weight</div>
          <div class="text-body-2xs">{{ edgesWeight }}</div>
        </div>
        <input
          id="edge-stroke"
          v-model="edgesWeight"
          class="w-full mt-1"
          type="range"
          name="edge-stroke"
          :min="0.5"
          :max="3"
          step="0.1"
          @input="handleEdgesWeightChange"
        />
        <div class="flex items-center justify-between gap-2 mt-1.5 mb-1 pr-0.5">
          <div class="text-body-2xs">Color</div>
          <div class="flex items-center gap-1">
            <button
              v-for="(color, index) in edgesColorOptions"
              :key="color"
              class="w-3 h-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110"
              :class="[
                edgesColor === color ? 'ring-2 ring-primary' : '',
                'border-[1.5px] border-outline-2'
              ]"
              :style="
                index === 0
                  ? {
                      background:
                        'linear-gradient(to top left, #1a1a1a 50%, #ffffff 50%)'
                    }
                  : {
                      backgroundColor: `#${color.toString(16).padStart(6, '0')}`
                    }
              "
              @click="setEdgesColor(color)"
            />
          </div>
        </div>
      </div>
    </div>
  </ViewerLayoutPanel>
</template>

<script setup lang="ts">
import { ViewMode } from '@speckle/viewer'
import { useViewerShortcuts, useViewModeUtilities } from '~~/lib/viewer/composables/ui'
import { ViewModeShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'
import { FormSwitch } from '@speckle/ui-components'
import { useTheme } from '~/lib/core/composables/theme'

const open = defineModel<boolean>('open', { default: false })

const {
  setViewMode,
  currentViewMode,
  edgesEnabled,
  toggleEdgesEnabled,
  setEdgesWeight,
  edgesWeight,
  setEdgesColor,
  edgesColor
} = useViewModeUtilities()
const { getShortcutDisplayText, registerShortcuts } = useViewerShortcuts()
const { isLightTheme } = useTheme()

const handleEdgesWeightChange = () => {
  setEdgesWeight(Number(edgesWeight.value))
}

registerShortcuts({
  SetViewModeDefault: () => handleViewModeChange(ViewMode.DEFAULT, true),
  SetViewModeSolid: () => handleViewModeChange(ViewMode.SOLID, true),
  SetViewModePen: () => handleViewModeChange(ViewMode.PEN, true),
  SetViewModeArctic: () => handleViewModeChange(ViewMode.ARCTIC, true),
  SetViewModeShaded: () => handleViewModeChange(ViewMode.SHADED, true)
})

const isActiveMode = (mode: ViewMode) => mode === currentViewMode.value

const viewModeShortcuts = Object.values(ViewModeShortcuts)

const emit = defineEmits<{
  (e: 'force-close-others'): void
}>()

const edgesColorOptions = computed(() => [
  isLightTheme.value || currentViewMode.value !== ViewMode.PEN ? 0x1a1a1a : 0xffffff, // black or white
  0x3b82f6, // blue-500
  0x8b5cf6, // violet-500
  0x65a30d, // lime-600
  0xf97316, // orange-500
  0xf43f5e //rose-500
])

const handleViewModeChange = (mode: ViewMode, isShortcut = false) => {
  setViewMode(mode)

  if (isShortcut) {
    if (!open.value) {
      emit('force-close-others')
    }
    open.value = true
  }
}
</script>
