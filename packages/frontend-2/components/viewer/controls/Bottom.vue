<template>
  <aside>
    <ViewerControlsButtonGroup
      v-show="activePanel === 'none'"
      class="absolute left-1/2 -translate-x-1/2 z-50"
      :class="isEmbedEnabled ? 'bottom-[4rem]' : 'bottom-4'"
    >
      <ViewerControlsButtonToggle
        v-for="panel in panels"
        :key="panel.id"
        v-tippy="getTooltipProps(panel.tooltip)"
        :active="activePanel === panel.id"
        :icon="panel.icon"
        :class="panel.extraClasses"
        @click="toggleActivePanel(panel.id)"
      />
    </ViewerControlsButtonGroup>

    <ViewerLayoutPanel
      v-if="activePanel !== 'none'"
      class="absolute left-1/2 -translate-x-1/2 z-50 flex p-1 items-center justify-between w-80"
      :class="isEmbedEnabled ? 'bottom-[4rem]' : 'bottom-4'"
    >
      <span class="flex items-center">
        <component :is="panels[activePanel].icon" class="h-4 w-4 ml-1 mr-1.5" />
        <p class="text-body-2xs text-foreground">
          {{ panels[activePanel].name }}
        </p>
      </span>
      <div class="flex items-center gap-1">
        <FormButton v-if="showResetButton" size="sm" color="subtle" @click="onReset">
          Reset
        </FormButton>
        <FormButton size="sm" @click="onActivePanelClose">Done</FormButton>
      </div>

      <div class="absolute left-1/2 -translate-x-1/2 bottom-9 w-80">
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
  useViewerShortcuts,
  useFilterUtilities
} from '~~/lib/viewer/composables/ui'
import { onKeyStroke } from '@vueuse/core'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

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
const { resetExplode } = useFilterUtilities()
const { getTooltipProps } = useSmartTooltipDelay()
const { isEnabled: isEmbedEnabled } = useEmbed()

const activePanel = ref<ActivePanel>(ActivePanel.none)
const panels = shallowRef({
  [ActivePanel.measurements]: {
    id: ActivePanel.measurements,
    name: 'Measure',
    icon: 'IconViewerMeasurements',
    tooltip: getShortcutDisplayText(shortcuts.ToggleMeasurements),
    extraClasses: 'hidden md:flex'
  },
  [ActivePanel.sectionBox]: {
    id: ActivePanel.sectionBox,
    name: 'Section',
    icon: 'IconViewerSectionBox',
    tooltip: getShortcutDisplayText(shortcuts.ToggleSectionBox),
    extraClasses: ''
  },
  [ActivePanel.explode]: {
    id: ActivePanel.explode,
    name: 'Explode',
    icon: 'IconViewerExplode',
    tooltip: 'Explode model',
    extraClasses: 'hidden md:flex'
  },
  [ActivePanel.viewModes]: {
    id: ActivePanel.viewModes,
    name: 'View modes',
    icon: 'IconViewerViewModes',
    tooltip: 'View modes',
    extraClasses: ''
  },
  [ActivePanel.lightControls]: {
    id: ActivePanel.lightControls,
    name: 'Light controls',
    icon: 'IconViewerLightControls',
    tooltip: 'Light controls',
    extraClasses: 'hidden md:flex'
  }
})

const showResetButton = computed(() => {
  return activePanel.value === ActivePanel.explode
})

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? ActivePanel.none : panel

  if (panel === ActivePanel.sectionBox) {
    toggleSectionBox()
  }

  if (panel === ActivePanel.measurements) {
    enableMeasurements(true)
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
  if (activePanel.value === ActivePanel.measurements) {
    enableMeasurements(false)
  }
  activePanel.value = ActivePanel.none
}

const onReset = () => {
  if (activePanel.value === ActivePanel.explode) {
    resetExplode()
  }
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
