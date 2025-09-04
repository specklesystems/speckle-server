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
        :dot="shouldShowDot(panel.id)"
        :icon="panel.icon"
        :class="panel.extraClasses"
        @click="toggleActivePanel(panel.id)"
      />
    </ViewerControlsButtonGroup>

    <ViewerLayoutPanel
      v-if="activePanel !== 'none'"
      class="absolute left-1/2 -translate-x-1/2 z-50 flex p-2 items-center justify-between w-80"
      :class="isEmbedEnabled ? 'bottom-[4rem]' : 'bottom-4'"
    >
      <span class="flex items-center">
        <component :is="panels[activePanel].icon" class="h-4 w-4 ml-1 mr-1.5" />
        <p class="text-body-2xs text-foreground">
          {{ panels[activePanel].name }}
        </p>
      </span>
      <div class="flex items-center gap-1">
        <FormButton
          v-if="showResetButton"
          tabindex="-1"
          size="sm"
          color="subtle"
          @click="onReset"
        >
          Reset
        </FormButton>
        <FormButton tabindex="-1" size="sm" @click="onActivePanelClose">
          Done
        </FormButton>
      </div>

      <div class="absolute left-1/2 -translate-x-1/2 bottom-11 w-80">
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
  useFilterUtilities,
  useViewModeUtilities
} from '~~/lib/viewer/composables/ui'
import { ViewMode } from '@speckle/viewer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { onKeyStroke, useBreakpoints } from '@vueuse/core'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { Ruler, Scissors, Sun, Layers2, Glasses } from 'lucide-vue-next'

enum ActivePanel {
  none = 'none',
  measurements = 'measurements',
  sectionBox = 'sectionBox',
  explode = 'explode',
  viewModes = 'viewModes',
  lightControls = 'lightControls'
}

const emit = defineEmits<{
  forceClosePanels: []
}>()

const { getShortcutDisplayText, shortcuts, registerShortcuts } = useViewerShortcuts()
const {
  toggleSectionBox,
  resetSectionBoxCompletely,
  closeSectionBox,
  isSectionBoxEnabled,
  isSectionBoxVisible
} = useSectionBoxUtilities()
const { enableMeasurements, hasMeasurements, measurements } = useMeasurementUtilities()
const { resetExplode } = useFilterUtilities()
const {
  viewMode: { mode: currentViewMode },
  setViewMode
} = useViewModeUtilities()
const {
  ui: { explodeFactor }
} = useInjectedViewerState()
const { getTooltipProps } = useSmartTooltipDelay()

const hasExplode = computed(() => explodeFactor.value > 0)
const hasNonDefaultViewMode = computed(() => currentViewMode.value !== ViewMode.DEFAULT)
const { isEnabled: isEmbedEnabled } = useEmbed()
const breakpoints = useBreakpoints(TailwindBreakpoints)
const isMobile = breakpoints.smaller('sm')
const mixpanel = useMixpanel()

const activePanel = ref<ActivePanel>(ActivePanel.none)

const panels = shallowRef({
  [ActivePanel.measurements]: {
    id: ActivePanel.measurements,
    name: 'Measure',
    icon: Ruler,
    tooltip: getShortcutDisplayText(shortcuts.ToggleMeasurements, {
      format: 'separate'
    }),
    extraClasses: 'hidden md:flex'
  },
  [ActivePanel.sectionBox]: {
    id: ActivePanel.sectionBox,
    name: 'Section',
    icon: Scissors,
    tooltip: getShortcutDisplayText(shortcuts.ToggleSectionBox, { format: 'separate' }),
    extraClasses: ''
  },
  [ActivePanel.explode]: {
    id: ActivePanel.explode,
    name: 'Explode',
    icon: Layers2,
    tooltip: getShortcutDisplayText(shortcuts.ToggleExplode, { format: 'separate' }),
    extraClasses: 'hidden md:flex'
  },
  [ActivePanel.viewModes]: {
    id: ActivePanel.viewModes,
    name: 'View modes',
    icon: Glasses,
    tooltip: getShortcutDisplayText(shortcuts.ToggleViewModes, { format: 'separate' }),
    extraClasses: ''
  },
  [ActivePanel.lightControls]: {
    id: ActivePanel.lightControls,
    name: 'Light controls',
    icon: Sun,
    tooltip: getShortcutDisplayText(shortcuts.ToggleLightControls, {
      format: 'separate'
    }),
    extraClasses: 'hidden md:flex'
  }
})

const showResetButton = computed(() => {
  return (
    activePanel.value === ActivePanel.explode ||
    activePanel.value === ActivePanel.sectionBox
  )
})

const shouldShowDot = (panelId: ActivePanel) => {
  switch (panelId) {
    case ActivePanel.measurements:
      return hasMeasurements.value
    case ActivePanel.sectionBox:
      return isSectionBoxEnabled.value
    case ActivePanel.explode:
      return hasExplode.value
    case ActivePanel.viewModes:
      return hasNonDefaultViewMode.value
    default:
      return false
  }
}

const toggleActivePanel = (panel: ActivePanel) => {
  activePanel.value = activePanel.value === panel ? ActivePanel.none : panel

  if (activePanel.value !== ActivePanel.none && isMobile.value) {
    emit('forceClosePanels')
  }

  if (panel === ActivePanel.sectionBox) {
    toggleSectionBox()
  }

  if (panel === ActivePanel.measurements) {
    enableMeasurements(true)
  }
}

const toggleMeasurements = () => {
  if (activePanel.value === ActivePanel.sectionBox) {
    toggleSectionBox()
  }

  const isMeasurementsActive = activePanel.value === ActivePanel.measurements
  enableMeasurements(!isMeasurementsActive)
  activePanel.value = isMeasurementsActive ? ActivePanel.none : ActivePanel.measurements
}

const toggleExplode = () => {
  activePanel.value =
    activePanel.value === ActivePanel.explode ? ActivePanel.none : ActivePanel.explode
}

const toggleSectionBoxPanel = () => {
  if (activePanel.value === ActivePanel.measurements) {
    enableMeasurements(false)
  }

  activePanel.value =
    activePanel.value === ActivePanel.sectionBox
      ? ActivePanel.none
      : ActivePanel.sectionBox
  toggleSectionBox()
}

const toggleViewModes = () => {
  activePanel.value =
    activePanel.value === ActivePanel.viewModes
      ? ActivePanel.none
      : ActivePanel.viewModes
}

const toggleLightControls = () => {
  activePanel.value =
    activePanel.value === ActivePanel.lightControls
      ? ActivePanel.none
      : ActivePanel.lightControls
}

const onActivePanelClose = () => {
  if (activePanel.value === ActivePanel.sectionBox) {
    closeSectionBox()
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
  if (activePanel.value === ActivePanel.sectionBox) {
    resetSectionBoxCompletely()
  }
}

const forceClosePanels = () => {
  activePanel.value = ActivePanel.none
}

const handleViewModeChange = (mode: ViewMode) => {
  setViewMode(mode)
}

registerShortcuts({
  ToggleMeasurements: () => toggleMeasurements(),
  ToggleExplode: () => toggleExplode(),
  ToggleSectionBox: () => toggleSectionBoxPanel(),
  ToggleViewModes: () => toggleViewModes(),
  ToggleLightControls: () => toggleLightControls(),
  SetViewModeDefault: () => handleViewModeChange(ViewMode.DEFAULT),
  SetViewModeSolid: () => handleViewModeChange(ViewMode.SOLID),
  SetViewModePen: () => handleViewModeChange(ViewMode.PEN),
  SetViewModeArctic: () => handleViewModeChange(ViewMode.ARCTIC),
  SetViewModeShaded: () => handleViewModeChange(ViewMode.SHADED)
})

onKeyStroke('Escape', () => {
  const hasActiveMeasurements = measurements.value.length > 0
  if (hasActiveMeasurements) return

  // Only close panels if there's no active measurement
  if (activePanel.value === ActivePanel.measurements) {
    toggleMeasurements()
  } else if (activePanel.value === ActivePanel.sectionBox) {
    closeSectionBox()
  }
  activePanel.value = ActivePanel.none
})

watch(activePanel, (newVal) => {
  // Using 'controls' here to stick to the old naming convention
  mixpanel.track('Viewer Action', {
    type: 'action',
    name: 'controls-toggle',
    action: newVal
  })
})

watch(isSectionBoxEnabled, (val) => {
  mixpanel.track('Viewer Action', {
    type: 'action',
    name: 'section-box',
    status: val
  })
})

watch(isSectionBoxVisible, (val) => {
  mixpanel.track('Viewer Action', {
    type: 'action',
    name: 'section-box-visibility',
    status: val
  })
})

defineExpose({
  forceClosePanels
})
</script>
