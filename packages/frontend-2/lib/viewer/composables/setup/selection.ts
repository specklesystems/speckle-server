import { SelectionEvent } from '@speckle/viewer'
import {
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'
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
        if (!args) return state.viewer.instance.zoom()
        if (!args.hits) return state.viewer.instance.zoom()
        if (args.hits.length === 0) return state.viewer.instance.zoom()

        const firstVisHit = args ? getFirstVisibleSelectionHit(args, state) : null
        if (!firstVisHit) return clearSelection()

        const objectId = args.hits[0].object.id
        state.viewer.instance.zoom([objectId])
      }
    },
    { state }
  )
}
