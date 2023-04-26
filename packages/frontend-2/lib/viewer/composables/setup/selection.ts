import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useCameraUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'

export function useViewerSelectionEventHandler() {
  const state = useInjectedViewerState()
  const { clearSelection, addToSelection } = useSelectionUtilities()
  const { zoom } = useCameraUtilities()

  useSelectionEvents(
    {
      singleClickCallback: (args, { firstVisibleSelectionHit }) => {
        if (!args) return clearSelection()
        if (args.hits.length === 0) return clearSelection()
        if (!args.multiple) clearSelection()

        if (!firstVisibleSelectionHit) return clearSelection()
        addToSelection(firstVisibleSelectionHit.object)
      },
      doubleClickCallback: (args, { firstVisibleSelectionHit }) => {
        if (!args) return zoom()
        if (!args.hits) return zoom()
        if (args.hits.length === 0) return zoom()

        const firstVisHit = firstVisibleSelectionHit
        if (!firstVisHit) return clearSelection()

        const objectId = args.hits[0].object.id
        zoom([objectId])
      }
    },
    { state }
  )
}
