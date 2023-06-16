/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Nullable } from '@speckle/shared'
import { SelectionEvent } from '@speckle/viewer'
import { SpeckleObject } from '~~/lib/common/helpers/sceneExplorer'
import { useMixpanel } from '~~/lib/core/composables/mp'
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
  const mp = useMixpanel()
  const trackAndClearSelection = () => {
    clearSelection()
    mp.track('Viewer Action', {
      type: 'action',
      name: 'selection',
      action: 'clear',
      source: 'viewer'
    })
  }
  useSelectionEvents(
    {
      singleClickCallback: (args, { firstVisibleSelectionHit }) => {
        if (!args) return trackAndClearSelection()
        if (args.hits.length === 0) return trackAndClearSelection()
        if (!args.multiple) clearSelection() // note we're not tracking selectino clearing here

        if (!firstVisibleSelectionHit) return clearSelection()
        addToSelection(firstVisibleSelectionHit.object)
        // Expands default viewer selection behaviour with a special case in diff mode.
        // In diff mode, if we select via a mouse click an object, and that object is
        // "modified", we want to select its pair as well.
        if (
          state.ui.diff.enabled.value &&
          state.ui.diff.result.value &&
          firstVisibleSelectionHit.object.applicationId
        ) {
          const modifiedObjectPairs = state.ui.diff.result.value.modified
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
        mp.track('Viewer Action', {
          type: 'action',
          name: 'selection',
          action: 'select',
          multiple: args.multiple
        })
      },
      doubleClickCallback: (args, { firstVisibleSelectionHit }) => {
        if (!args) return zoom()
        if (!args.hits) return zoom()
        if (args.hits.length === 0) return zoom()

        const firstVisHit = firstVisibleSelectionHit
        if (!firstVisHit) return clearSelection()

        const objectId = args.hits[0].object.id
        zoom([objectId])
        mp.track('Viewer Action', {
          type: 'action',
          name: 'zoom',
          source: 'object-double-click'
        })
      }
    },
    { state }
  )
}

export function useViewerSelectionEventHandler() {
  useCollectSelection()
  useSelectOrZoomOnSelection()
}
