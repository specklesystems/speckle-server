import { SelectionEvent } from '@speckle/viewer'
import {
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useCameraUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'

function getFirstVisibleSelectionHit(
  { hits }: SelectionEvent,
  state: InjectableViewerState
) {
  const {
    viewer: {
      metadata: { filteringState }
    }
  } = state

  const hasHiddenObjects =
    !!filteringState.value?.hiddenObjects &&
    filteringState.value?.hiddenObjects.length !== 0
  const hasIsolatedObjects =
    !!filteringState.value?.isolatedObjects &&
    filteringState.value?.isolatedObjects.length !== 0

  for (const hit of hits) {
    if (hasHiddenObjects) {
      if (!filteringState.value?.hiddenObjects?.includes(hit.object.id as string)) {
        return hit
      }
    } else if (hasIsolatedObjects) {
      if (filteringState.value.isolatedObjects?.includes(hit.object.id as string))
        return hit
    } else {
      return hit
    }
  }
  return null
}

export function useViewerSelectionEventHandler() {
  const state = useInjectedViewerState()
  const { clearSelection, addToSelection } = useSelectionUtilities()
  const { zoom } = useCameraUtilities()

  useSelectionEvents(
    {
      singleClickCallback: (args) => {
        if (!args) return clearSelection()
        if (args.hits.length === 0) return clearSelection()
        if (!args.multiple) clearSelection()

        const firstVisHit = args ? getFirstVisibleSelectionHit(args, state) : null
        if (!firstVisHit) return clearSelection()
        addToSelection(firstVisHit.object)
      },
      doubleClickCallback: (args) => {
        if (!args) return zoom()
        if (!args.hits) return zoom()
        if (args.hits.length === 0) return zoom()

        const firstVisHit = args ? getFirstVisibleSelectionHit(args, state) : null
        if (!firstVisHit) return clearSelection()

        const objectId = args.hits[0].object.id
        zoom([objectId])
      }
    },
    { state }
  )
}
