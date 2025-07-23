<template>
  <aside>
    <ViewerControlsButtonGroup
      v-show="activePanel === 'none'"
      class="absolute left-1/2 -translate-x-1/2 bottom-6 z-20"
    >
      <ViewerControlsButtonToggle
        v-tippy="getShortcutDisplayText(shortcuts.ToggleMeasurements)"
        :active="activePanel === 'measurements'"
        icon="IconViewerMeasurements"
        @click="toggleActivePanel('measurements')"
      />
      <ViewerControlsButtonToggle
        v-tippy="getShortcutDisplayText(shortcuts.ToggleSectionBox)"
        flat
        secondary
        :active="isSectionBoxVisible"
        icon="IconViewerSectionBox"
        @click="toggleSectionBoxPanel"
      />
      <ViewerControlsButtonToggle
        v-tippy="isSmallerOrEqualSm ? undefined : 'Explode model'"
        :active="activePanel === 'explode'"
        icon="IconViewerExplode"
        @click="toggleActivePanel('explode')"
      />
      <ViewerControlsButtonToggle
        v-tippy="isSmallerOrEqualSm ? undefined : 'View modes'"
        :active="activePanel === 'viewModes'"
        icon="IconViewerViewModes"
        @click="toggleActivePanel('viewModes')"
      />
      <ViewerControlsButtonToggle
        v-tippy="isSmallerOrEqualSm ? undefined : 'Light controls'"
        :active="activePanel === 'lightControls'"
        icon="IconViewerLightControls"
        @click="toggleActivePanel('lightControls')"
      />
    </ViewerControlsButtonGroup>

    <ViewerLayoutPanel
      v-if="activePanel !== 'none'"
      class="absolute left-1/2 -translate-x-1/2 bottom-6 z-30 flex p-1 items-center justify-between w-72"
    >
      <span class="flex items-center">
        <component :is="iconMap[activePanel]" class="h-4 w-4 ml-1 mr-1.5" />
        <p class="text-body-2xs text-foreground">
          {{ panelNames[activePanel] }}
        </p>
      </span>
      <FormButton size="sm" @click="onActivePanelClose">Done</FormButton>

      <div class="absolute left-1/2 -translate-x-1/2 bottom-10 w-72">
        <KeepAlive>
          <ViewerMeasurementsPanel
            v-show="activePanel === 'measurements'"
            @close="toggleMeasurements"
          />
        </KeepAlive>
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
import { useIsSmallerOrEqualThanBreakpoint } from '~~/composables/browser'

type ActivePanel =
  | 'none'
  | 'measurements'
  | 'sectionBox'
  | 'explode'
  | 'viewModes'
  | 'lightControls'

const { getShortcutDisplayText, shortcuts, registerShortcuts } = useViewerShortcuts()
const { isSectionBoxVisible, toggleSectionBox } = useSectionBoxUtilities()
const { getActiveMeasurement, removeMeasurement, enableMeasurements } =
  useMeasurementUtilities()
const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()

const activePanel = ref<ActivePanel>('none')
const iconMap = shallowRef({
  measurements: 'IconViewerMeasurements',
  sectionBox: 'IconViewerSectionBox',
  explode: 'IconViewerExplode',
  viewModes: 'IconViewerViewModes',
  lightControls: 'IconViewerLightControls'
})
const panelNames = shallowRef({
  measurements: 'Measurements',
  sectionBox: 'Section box',
  explode: 'Explode',
  viewModes: 'View modes',
  lightControls: 'Light controls'
})

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

const onActivePanelClose = () => {
  if (activePanel.value === 'sectionBox') {
    toggleSectionBox()
  }
  activePanel.value = 'none'
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
