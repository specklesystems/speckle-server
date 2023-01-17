// import { useInjectedViewer } from './viewer'
// import { SelectionEvent } from '@speckle/viewer'

// export function useSetupViewerSelectionEvents(callback: () => void): void {
//   const { viewer } = useInjectedViewer()

//   onMounted(() => {
//     viewer.cameraHandler.controls.addEventListener('update', callback)
//   })

//   onBeforeUnmount(() => {
//     viewer.cameraHandler.controls.removeEventListener('update', callback)
//   })
// }

//   const handleSelection = (selectionInfo: SelectionEvent) => {

//   }

//   const getFirstVisibleSelectionHit = ({ hits }: SelectionEvent) => {
//   // const { currentFilterState } = { ...commitObjectViewerState() }
//   return hits[0]

//   // const hasHiddenObjects =
//   //   !!currentFilterState?.hiddenObjects &&
//   //   currentFilterState?.hiddenObjects.length !== 0
//   // const hasIsolatedObjects =
//   //   !!currentFilterState?.isolatedObjects &&
//   //   currentFilterState?.isolatedObjects.length !== 0

//   // for (const hit of hits) {
//   //   if (hasHiddenObjects) {
//   //     if (!currentFilterState?.hiddenObjects?.includes(hit.object.id as string)) {
//   //       return hit
//   //     }
//   //   } else if (hasIsolatedObjects) {
//   //     if (currentFilterState.isolatedObjects?.includes(hit.object.id as string))
//   //       return hit
//   //   } else {
//   //     return hit
//   //   }
//   // }
//   // return null
// }
