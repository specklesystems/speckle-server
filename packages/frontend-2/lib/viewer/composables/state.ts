import { useInjectedViewer } from './viewer'
import { SelectionEvent, ViewerEvent } from '@speckle/viewer'

export function useInjectedViewerState() {
  const { viewer } = useInjectedViewer()

  const viewerIsBusy = ref(false)
  viewer.on(ViewerEvent.Busy, (isBusy: boolean) => (viewerIsBusy.value = isBusy))

  return {
    viewerIsBusy
  }
}

function useSelectionEvents(
  singleClickCallback: () => void,
  doubleClickCallback: () => void
) {
  const { viewer } = useInjectedViewer()

  onMounted(() => {
    viewer.on(ViewerEvent.ObjectDoubleClicked, doubleClickCallback)
    viewer.on(ViewerEvent.ObjectClicked, singleClickCallback)
  })

  onBeforeUnmount(() => {
    viewer.removeListener(ViewerEvent.ObjectDoubleClicked, doubleClickCallback)
  })
}
