<template>
  <aside>
    <ViewerControlsButtonGroup
      v-show="activePanel === 'none'"
      class="absolute left-1/2 -translate-x-1/2 bottom-4 z-20"
    >
      <ViewerControlsButtonToggle
        v-for="panel in panels"
        :key="panel.id"
        v-tippy="panel.tooltip"
        :active="activePanel === panel.id"
        :icon="panel.icon"
        @click="toggleActivePanel(panel.id)"
      />
    </ViewerControlsButtonGroup>

    <ViewerLayoutPanel
      v-if="activePanel !== 'none'"
      class="absolute left-1/2 -translate-x-1/2 bottom-4 z-30 flex p-1 items-center justify-between w-72"
    >
      <span class="flex items-center">
        <component :is="panels[activePanel].icon" class="h-4 w-4 ml-1 mr-1.5" />
        <p class="text-body-2xs text-foreground">
          {{ panels[activePanel].name }}
        </p>
      </span>
      <FormButton size="sm" @click="onActivePanelClose">Done</FormButton>

      <div class="absolute left-1/2 -translate-x-1/2 bottom-10 w-72">
        <ViewerMeasurementsMenu v-show="activePanel === 'measurements'" />
        <ViewerExplodeMenu v-show="activePanel === 'explode'" />
        <ViewerViewModesMenu v-show="activePanel === 'viewModes'" />
        <ViewerLightControlsMenu v-show="activePanel === 'lightControls'" />
      </div>
    </ViewerLayoutPanel>
  </aside>
</template>

<script setup lang="ts">
import {
  useSectionBoxUtilities,
  useMeasurementUtilities,
  useViewerShortcuts
} from '~~/lib/viewer/composables/ui'
import { onKeyStroke } from '@vueuse/core'

enum ActivePanel {
  none = 'none',
  measurements = 'measurements',
  sectionBox = 'sectionBox',
  explode = 'explode',
  viewModes = 'viewModes',
  lightControls = 'lightControls'
}

const { getShortcutDisplayText, shortcuts, registerShortcuts } = useViewerShortcuts()
const { toggleSectionBox } = useSectionBoxUtilities()
const { getActiveMeasurement, removeMeasurement, enableMeasurements } =
  useMeasurementUtilities()

const activePanel = ref<ActivePanel>(ActivePanel.none)
const panels = shallowRef({
  [ActivePanel.measurements]: {
    id: ActivePanel.measurements,
    name: 'Measure',
    icon: 'IconViewerMeasurements',
    tooltip: getShortcutDisplayText(shortcuts.ToggleMeasurements)
  },
  [ActivePanel.sectionBox]: {
    id: ActivePanel.sectionBox,
    name: 'Section',
    icon: 'IconViewerSectionBox',
    tooltip: getShortcutDisplayText(shortcuts.ToggleSectionBox)
  },
  [ActivePanel.explode]: {
    id: ActivePanel.explode,
    name: 'Explode',
    icon: 'IconViewerExplode',
    tooltip: 'Explode model'
  },
  [ActivePanel.viewModes]: {
    id: ActivePanel.viewModes,
    name: 'View modes',
    icon: 'IconViewerViewModes',
    tooltip: 'View modes'
  },
  [ActivePanel.lightControls]: {
    id: ActivePanel.lightControls,
    name: 'Light controls',
    icon: 'IconViewerLightControls',
    tooltip: 'Light controls'
  }
})

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? ActivePanel.none : panel

  if (panel === ActivePanel.sectionBox) {
    toggleSectionBox()
  }
}

const toggleMeasurements = () => {
  const isMeasurementsActive = activePanel.value === ActivePanel.measurements
  enableMeasurements(!isMeasurementsActive)
  activePanel.value = isMeasurementsActive ? ActivePanel.none : ActivePanel.measurements
}

const onActivePanelClose = () => {
  if (activePanel.value === ActivePanel.sectionBox) {
    toggleSectionBox()
  }
  activePanel.value = ActivePanel.none
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
    if (activePanel.value === ActivePanel.measurements) {
      toggleMeasurements()
    }
    activePanel.value = ActivePanel.none
  }
})
</script>
