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
    ui: {
      filters: { hiddenObjectIds, isolatedObjectIds }
    }
  } = state

  const hasHiddenObjects = !!hiddenObjectIds.value.length
  const hasIsolatedObjects = !!isolatedObjectIds.value.length

  for (const hit of hits) {
    if (hasHiddenObjects) {
      if (!hiddenObjectIds.value.includes(hit.object.id as string)) {
        return hit
      }
    } else if (hasIsolatedObjects) {
      if (isolatedObjectIds.value.includes(hit.object.id as string)) return hit
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
