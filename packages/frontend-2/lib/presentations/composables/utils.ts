import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'

export const useResetViewUtils = () => {
  const {
    response: { presentation },
    ui: { slideIdx },
    viewer: { hasViewChanged }
  } = useInjectedPresentationState()

  const { emit } = useEventBus()

  const resetView = () => {
    const slides = presentation.value?.views.items || []
    const currentSlide = slides.at(slideIdx.value)

    if (!currentSlide?.id) return

    emit(ViewerEventBusKeys.ApplySavedView, {
      id: currentSlide.id,
      loadOriginal: false
    })

    hasViewChanged.value = false
  }

  return { resetView }
}
