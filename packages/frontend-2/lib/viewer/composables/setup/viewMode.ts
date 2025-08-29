import { defaultViewModeEdgeColorValue } from '@speckle/shared/viewer/state'
import { ViewMode, ViewModes } from '@speckle/viewer'
import { watchTriggerable } from '@vueuse/core'
import { useTheme } from '~/lib/core/composables/theme'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'

export const defaultEdgeColorValue = defaultViewModeEdgeColorValue
export const edgeColorDark = 0x1a1a1a
export const edgeColorLight = 0xffffff

export const useViewModesSetup = () => {
  const { isLightTheme } = useTheme()

  const mode = ref<ViewMode>(ViewMode.DEFAULT)
  const edgesEnabled = ref(true)
  const edgesWeight = ref(1)
  const outlineOpacity = ref(0.75)
  const edgesColor = ref<typeof defaultEdgeColorValue | number>(defaultEdgeColorValue)

  const defaultEdgesColor = computed(() => {
    // Always default to dark edges, only use light edges in PEN mode + dark theme
    if (mode.value === ViewMode.PEN && !isLightTheme.value) {
      return edgeColorLight
    }
    return edgeColorDark
  })

  const finalEdgesColor = computed(() => {
    if (edgesColor.value !== defaultEdgeColorValue) return edgesColor.value
    return defaultEdgesColor.value
  })

  const resetViewMode = () => {
    mode.value = ViewMode.DEFAULT
    edgesEnabled.value = true
    edgesWeight.value = 1
    outlineOpacity.value = 0.75
    edgesColor.value = defaultEdgeColorValue
  }

  return {
    viewMode: {
      mode,
      edgesEnabled,
      edgesWeight,
      outlineOpacity,
      edgesColor,
      finalEdgesColor,
      defaultEdgesColor,
      resetViewMode
    }
  }
}

export const useViewModesPostSetup = () => {
  const {
    ui: { viewMode },
    viewer: { instance }
  } = useInjectedViewerState()
  const {
    mode,
    edgesEnabled,
    edgesWeight,
    outlineOpacity,
    finalEdgesColor,
    resetViewMode
  } = viewMode

  const updateViewMode = () => {
    const viewModes = instance.getExtension(ViewModes)
    if (viewModes) {
      viewModes.setViewMode(mode.value, {
        edges: edgesEnabled.value,
        outlineThickness: edgesWeight.value,
        outlineOpacity: outlineOpacity.value,
        outlineColor: finalEdgesColor.value
      })
    }
  }

  // state -> viewer
  useOnViewerLoadComplete(
    () => {
      updateViewMode()
    },
    { initialOnly: true }
  )

  const { ignoreUpdates: ignoreEdgesEnabledUpdates } = watchTriggerable(
    edgesEnabled,
    (newVal, oldVal) => {
      if (oldVal === newVal) return
      updateViewMode()
    }
  )
  watchTriggerable(edgesWeight, (newVal, oldVal) => {
    if (oldVal === newVal) return
    updateViewMode()
  })
  const { ignoreUpdates: ignoreOutlineOpacityUpdates } = watchTriggerable(
    outlineOpacity,
    (newVal, oldVal) => {
      if (oldVal === newVal) return
      updateViewMode()
    }
  )
  watchTriggerable(finalEdgesColor, (newVal, oldVal) => {
    if (oldVal === newVal) return
    updateViewMode()
  })
  watchTriggerable(mode, (newVal, oldVal) => {
    if (oldVal === newVal) return

    if (newVal === ViewMode.PEN) {
      ignoreOutlineOpacityUpdates(() => (outlineOpacity.value = 1))
      ignoreEdgesEnabledUpdates(() => (edgesEnabled.value = true))
    } else {
      ignoreOutlineOpacityUpdates(() => (outlineOpacity.value = 0.75))
    }
    updateViewMode()
  })

  onBeforeUnmount(() => {
    resetViewMode()
  })
}
