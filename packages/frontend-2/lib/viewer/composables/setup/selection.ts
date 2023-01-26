import { SelectionEvent } from '@speckle/viewer'
import { InjectableViewerState } from '~~/lib/viewer/composables/setup'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'

function getFirstVisibleSelectionHit(
  { hits }: SelectionEvent,
  state: InjectableViewerState
) {
  const {
    ui: {
      filters: { current }
    }
  } = state

  const hasHiddenObjects =
    !!current.value?.hiddenObjects && current.value?.hiddenObjects.length !== 0
  const hasIsolatedObjects =
    !!current.value?.isolatedObjects && current.value?.isolatedObjects.length !== 0

  for (const hit of hits) {
    if (hasHiddenObjects) {
      if (!current.value?.hiddenObjects?.includes(hit.object.id as string)) {
        return hit
      }
    } else if (hasIsolatedObjects) {
      if (current.value.isolatedObjects?.includes(hit.object.id as string)) return hit
    } else {
      return hit
    }
  }
  return null
}

export function useViewerSelectionEventHandler(state: InjectableViewerState) {
  useSelectionEvents(
    {
      // test
      singleClickCallback: (args: SelectionEvent) => {
        console.log('TODO: single click event')
        if (!args) return state.ui.selection.clearSelection()
        if (args.hits.length === 0) return state.ui.selection.clearSelection()
        if (!args.multiple) state.ui.selection.clearSelection()

        const firstVisHit = args ? getFirstVisibleSelectionHit(args, state) : null
        if (!firstVisHit) return state.ui.selection.clearSelection()
        state.ui.selection.addToSelection(firstVisHit.object)
      },
      doubleClickCallback: (args) => {
        console.log('double click event', args)
        if (!args) return state.viewer.instance.zoom()
        if (!args.hits) return state.viewer.instance.zoom()
        if (args.hits.length === 0) return state.viewer.instance.zoom()

        const firstVisHit = args ? getFirstVisibleSelectionHit(args, state) : null
        if (!firstVisHit) return state.ui.selection.clearSelection()

        const objectId = args.hits[0].object.id
        state.viewer.instance.zoom([objectId as string])
      }
    },
    { state }
  )
}
