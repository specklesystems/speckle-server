import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

export function useViewerCameraTracker(callback: () => void): void {
  const {
    viewer: { instance }
  } = useInjectedViewerState()

  onMounted(() => {
    instance.cameraHandler.controls.addEventListener('update', callback)
  })

  onBeforeUnmount(() => {
    instance.cameraHandler.controls.removeEventListener('update', callback)
  })
}
