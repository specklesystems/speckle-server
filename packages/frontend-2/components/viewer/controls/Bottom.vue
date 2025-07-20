<template>
  <aside class="absolute left-1/2 -translate-x-1/2 bottom-6 z-20">
    <ViewerControlsButtonGroup>
      <!-- Measurements -->
      <ViewerControlsButtonToggle
        v-tippy="getShortcutDisplayText(shortcuts.ToggleMeasurements)"
        :active="activePanel === 'measurements'"
        @click="toggleActivePanel('measurements')"
      >
        <IconViewerMeasurements class="h-4 w-4 md:h-5 md:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Section Box -->
      <ViewerControlsButtonToggle
        v-tippy="getShortcutDisplayText(shortcuts.ToggleSectionBox)"
        flat
        secondary
        :active="isSectionBoxVisible"
        @click="toggleSectionBoxPanel"
      >
        <IconViewerSectionBox class="h-4 w-4 md:h-5 md:w-5" />
      </ViewerControlsButtonToggle>

      <!-- Explosion -->
      <ViewerExplodeMenu
        :open="activePanel === 'explode'"
        @force-close-others="activePanel = 'none'"
        @update:open="(value) => toggleActivePanel(value ? 'explode' : 'none')"
      />

      <!-- View Modes -->
      <ViewerViewModesMenu
        :open="activePanel === 'viewModes'"
        @force-close-others="activePanel = 'none'"
        @update:open="(value) => toggleActivePanel(value ? 'viewModes' : 'none')"
      />

      <!-- Light controls -->
      <ViewerLightControlsMenu
        :open="activePanel === 'sun'"
        @update:open="(value) => toggleActivePanel(value ? 'sun' : 'none')"
      />

      <KeepAlive v-if="activePanel === 'measurements'">
        <ViewerMeasurementsOptions @close="toggleMeasurements" />
      </KeepAlive>
    </ViewerControlsButtonGroup>
  </aside>
</template>

<script setup lang="ts">
import {
  useSectionBoxUtilities,
  useMeasurementUtilities,
  useViewerShortcuts
} from '~~/lib/viewer/composables/ui'
import { onKeyStroke } from '@vueuse/core'

type ActivePanel =
  | 'none'
  | 'measurements'
  | 'sectionBox'
  | 'explode'
  | 'viewModes'
  | 'sun'

const { getShortcutDisplayText, shortcuts, registerShortcuts } = useViewerShortcuts()
const { isSectionBoxVisible, toggleSectionBox } = useSectionBoxUtilities()
const { getActiveMeasurement, removeMeasurement, enableMeasurements } =
  useMeasurementUtilities()

const activePanel = ref<ActivePanel>('none')

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? 'none' : panel
}

const toggleSectionBoxPanel = () => {
  toggleSectionBox()
  activePanel.value = activePanel.value === 'sectionBox' ? 'none' : 'sectionBox'
}

const toggleMeasurements = () => {
  const isMeasurementsActive = activePanel.value === 'measurements'
  enableMeasurements(!isMeasurementsActive)
  activePanel.value = isMeasurementsActive ? 'none' : 'measurements'
}

registerShortcuts({
  ToggleMeasurements: () => toggleMeasurements(),
  ToggleSectionBox: () => toggleSectionBox()
})

onKeyStroke('Escape', () => {
  const isActiveMeasurement = getActiveMeasurement()

  if (isActiveMeasurement) {
    removeMeasurement()
  } else {
    if (activePanel.value === 'measurements') {
      toggleMeasurements()
    }
    activePanel.value = 'none'
  }
})
</script>
