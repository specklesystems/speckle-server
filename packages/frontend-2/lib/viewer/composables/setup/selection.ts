/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { MeasurementType } from '@speckle/viewer'
import type { SpeckleObject } from '~/lib/viewer/helpers/sceneExplorer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useCameraUtilities, useSelectionUtilities } from '~~/lib/viewer/composables/ui'
import { useSelectionEvents } from '~~/lib/viewer/composables/viewer'

function useCollectSelection() {
  const {
    ui: { selection }
  } = useInjectedViewerState()

  const selectionCallback: Parameters<
    typeof useSelectionEvents
  >[0]['singleClickCallback'] = (_event, { firstVisibleSelectionHit }) => {
    if (!firstVisibleSelectionHit) return (selection.value = null) // reset selection location
    selection.value = firstVisibleSelectionHit.point
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
  const logger = useLogger()

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
        addToSelection(firstVisibleSelectionHit.node.model.raw as SpeckleObject)
        // Expands default viewer selection behaviour with a special case in diff mode.
        // In diff mode, if we select via a mouse click an object, and that object is
        // "modified", we want to select its pair as well.
        if (
          state.ui.diff.enabled.value &&
          state.ui.diff.result.value &&
          firstVisibleSelectionHit.node.model.raw.applicationId
        ) {
          const modifiedObjectPairs = state.ui.diff.result.value.modified
          const obj = firstVisibleSelectionHit.node.model.raw as SpeckleObject
          const pairedItems = modifiedObjectPairs.find((item) => {
            if (
              (item[0].model.raw as SpeckleObject).id === obj.id ||
              (item[1].model.raw as SpeckleObject).id === obj.id
            ) {
              return true
            }
          })
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
        const isMeasureMode = state.ui.measurement.enabled.value
        const measurementType = state.ui.measurement.options.value.type

        if (isMeasureMode && measurementType === MeasurementType.PERPENDICULAR) {
          return
        }
        if (!args) return zoom()
        if (!args.hits) return zoom()
        if (args.hits.length === 0) return zoom()

        const firstVisHit = firstVisibleSelectionHit
        if (!firstVisHit) return clearSelection()

        if (state.ui.filters.selectedObjects.value.length !== 0) {
          const ids = state.ui.filters.selectedObjects.value.map((o) => o.id as string)
          zoom(ids)
        } // else somethingn is weird.
        else {
          logger.warn(
            "Got a double click event but there's no selected object in the state - this should be impossible :)"
          )
        }
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
