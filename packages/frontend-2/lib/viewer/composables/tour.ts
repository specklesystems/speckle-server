import { useConditionalViewerRendering } from '~/lib/viewer/composables/ui'

export const useTourStageState = () =>
  useState('viewer-tour-state', () => ({
    showNavbar: true,
    showViewerControls: true,
    showTour: false,
    showSegmentation: true
  }))

export function useViewerTour() {
  const state = useTourStageState()
  const conditionalRendering = useConditionalViewerRendering()

  const showNavbar = computed({
    get: () => conditionalRendering.showNavbar.value,
    set: (newVal) => (state.value.showNavbar = newVal)
  })

  const showControls = computed({
    get: () => conditionalRendering.showControls.value,
    set: (newVal) => (state.value.showViewerControls = newVal)
  })

  const showTour = computed({
    get: () => state.value.showTour,
    set: (newVal) => (state.value.showTour = newVal)
  })

  const showSegmentation = computed({
    get: () => state.value.showSegmentation,
    set: (newVal) => (state.value.showSegmentation = newVal)
  })

  return {
    showNavbar,
    showControls,
    showTour,
    showSegmentation
  }
}
