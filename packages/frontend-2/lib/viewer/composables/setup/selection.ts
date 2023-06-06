/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Nullable } from '@speckle/shared'
import { SelectionEvent } from '@speckle/viewer'
import { SpeckleObject } from '~~/lib/common/helpers/sceneExplorer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useCameraUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'

function useCollectSelection() {
  const {
    ui: { selection }
  } = useInjectedViewerState()

  const selectionCallback = (event: Nullable<SelectionEvent>) => {
    if (!event) return (selection.value = null) // reset selection location

    const firstHit = event.hits[0]
    selection.value = firstHit.point
  }
  useSelectionEvents({
    singleClickCallback: selectionCallback,
    doubleClickCallback: selectionCallback
  })
}

function useSelectOrZoomOnSelection() {
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
        // Expands default viewer selection behaviour with a special case in diff mode.
        // In diff mode, if we select via a mouse click an object, and that object is
        // "modified", we want to select its pair as well.
        if (
          state.ui.diff.enabled.value &&
          state.ui.diff.diffResult.value &&
          firstVisibleSelectionHit.object.applicationId
        ) {
          const modifiedObjectPairs = state.ui.diff.diffResult.value.modified
          const obj = firstVisibleSelectionHit.object
          const pairedItems = modifiedObjectPairs.find(
            (item) =>
              (item[0].model.raw as SpeckleObject).id === obj.id ||
              (item[1].model.raw as SpeckleObject).id === obj.id
          )
          if (!pairedItems) return

          const pair =
            (pairedItems[0].model.raw as SpeckleObject).id === obj.id
              ? (pairedItems[1].model.raw as SpeckleObject)
              : (pairedItems[0].model.raw as SpeckleObject)
          if (!pair) return
          addToSelection(pair)
        }
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

export function useViewerSelectionEventHandler() {
  useCollectSelection()
  useSelectOrZoomOnSelection()
}
