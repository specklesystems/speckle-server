<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div>
    <ViewerLayoutPanel v-if="showSettings">
      <div class="p-3 py-2.5 flex items-center justify-between">
        <span class="text-body-2xs font-medium text-foreground leading-none">
          Edges
        </span>
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
      <div v-if="edgesEnabled" class="p-3 pb-2.5 pt-1">
        <div>
          <FormRange
            :model-value="edgesWeight"
            name="edge-stroke"
            label="Weight"
            :min="0.5"
            :max="3"
            :step="0.1"
            @update:model-value="setEdgesWeight"
          />
          <div class="flex items-center justify-between my-1">
            <div class="text-body-2xs">Color</div>
            <div class="flex items-center gap-1 bg-highlight-1 rounded-lg p-1">
              <button
                v-for="(color, index) in edgesColorOptions"
                :key="color"
                class="flex items-center justify-center size-6"
                :class="
                  edgesColor === color &&
                  'bg-foundation border border-outline-2 rounded-lg'
                "
                @click="setEdgesColor(color)"
              >
                <span
                  class="size-4 rounded-full cursor-pointer"
                  :style="{
                    background:
                      index === 0
                        ? 'linear-gradient(to top left, #1a1a1a 50%, #ffffff 50%)'
                        : `#${color.toString(16).padStart(6, '0')}`
                  }"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ViewerLayoutPanel>
    <ViewerLayoutPanel class="mt-1 p-2 flex justify-between items-center">
      <ViewerButtonGroup>
        <ViewerButtonGroupButton
          v-for="shortcut in viewModeShortcuts"
          :key="shortcut.name"
          :is-active="isActiveMode(shortcut.viewMode)"
          @click="handleViewModeChange(shortcut.viewMode)"
        >
          <span class="text-body-2xs text-foreground px-2 py-1">
            {{ shortcut.name }}
          </span>
        </ViewerButtonGroupButton>
      </ViewerButtonGroup>
      <button
        class="size-6 flex items-center justify-center rounded-md"
        :class="[
          showSettings &&
            'text-primary-focus bg-info-lighter dark:text-foreground-on-primary',
          !showSettings && 'text-foreground hover:bg-foundation-2'
        ]"
        @click="showSettings = !showSettings"
      >
        <IconViewerSettings class="size-4" />
      </button>
    </ViewerLayoutPanel>
  </div>
</template>

<script setup lang="ts">
import { ViewMode } from '@speckle/viewer'
import { useViewModeUtilities } from '~~/lib/viewer/composables/ui'
import { ViewModeShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'
import { FormSwitch } from '@speckle/ui-components'
import { useTheme } from '~/lib/core/composables/theme'

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
const { isLightTheme } = useTheme()

const showSettings = ref(false)

const isActiveMode = (mode: ViewMode) => mode === currentViewMode.value

const viewModeShortcuts = Object.values(ViewModeShortcuts)

const edgesColorOptions = computed(() => [
  isLightTheme.value || currentViewMode.value !== ViewMode.PEN ? 0x1a1a1a : 0xffffff, // black or white
  0x3b82f6, // blue-500
  0x8b5cf6, // violet-500
  0x65a30d, // lime-600
  0xf97316, // orange-500
  0xf43f5e //rose-500
])

const handleViewModeChange = (mode: ViewMode) => {
  setViewMode(mode)
}
</script>
