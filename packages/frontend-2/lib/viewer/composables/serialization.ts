import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { isNonNullable } from '~~/lib/common/helpers/utils'
import { SpeckleViewer } from '@speckle/shared'
import { get } from 'lodash-es'
import { Vector3, Box3 } from 'three'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { NumericPropertyInfo } from '@speckle/viewer'

type SerializedViewerState = SpeckleViewer.ViewerState.SerializedViewerState

export function useStateSerialization() {
  const state = useInjectedViewerState()

  const serialize = (): SerializedViewerState => {
    const camControls = state.viewer.instance.cameraHandler.activeCam.controls
    const box = state.viewer.instance.getCurrentSectionBox()

    const ret: SerializedViewerState = {
      projectId: state.projectId.value,
      sessionId: state.sessionId.value,
      viewer: {
        metadata: {
          filteringState: state.viewer.metadata.filteringState.value
            ? {
                passMin: state.viewer.metadata.filteringState.value.passMin,
                passMax: state.viewer.metadata.filteringState.value.passMax
              }
            : null
        }
      },
      resources: {
        request: {
          resourceIdString: state.resources.request.resourceIdString.value,
          threadFilters: { ...state.resources.request.threadFilters.value }
        }
      },
      ui: {
        threads: {
          openThread: {
            threadId: state.ui.threads.openThread.thread.value?.id || null,
            isTyping: state.ui.threads.openThread.isTyping.value,
            newThreadEditor: state.ui.threads.openThread.newThreadEditor.value
          }
        },
        spotlightUserSessionId: state.ui.spotlightUserSessionId.value,
        filters: {
          isolatedObjectIds: state.ui.filters.isolatedObjectIds.value,
          hiddenObjectIds: state.ui.filters.hiddenObjectIds.value,
          selectedObjectIds: state.ui.filters.selectedObjects.value
            .map((o) => o.id)
            .filter(isNonNullable),
          propertyFilter: {
            key: state.ui.filters.propertyFilter.filter.value?.key || null,
            isApplied: state.ui.filters.propertyFilter.isApplied.value
          }
        },
        camera: {
          position: state.ui.camera.position.value.toArray(),
          target: state.ui.camera.target.value.toArray(),
          isOrthoProjection: state.ui.camera.isOrthoProjection.value,
          zoom: (get(camControls, '_zoom') as number) || 1 // kinda hacky, _zoom is a protected prop
        },
        sectionBox: state.ui.sectionBox.value
          ? {
              min: box.min.toArray(),
              max: box.max.toArray()
            }
          : null,
        lightConfig: { ...state.ui.lightConfig.value },
        explodeFactor: state.ui.explodeFactor.value,
        selection: state.ui.selection.value?.toArray() || null
      }
    }
    return ret
  }

  return { serialize }
}

export enum StateApplyMode {
  Spotlight,
  ThreadOpen,
  TheadFullContextOpen,
  Reset
}

export function useApplySerializedState() {
  const {
    ui: {
      camera: { position, target, isOrthoProjection },
      sectionBox,
      highlightedObjectIds,
      explodeFactor,
      lightConfig
    },
    resources: {
      request: { resourceIdString }
    },
    urlHashState
  } = useInjectedViewerState()
  const {
    resetFilters,
    hideObjects,
    isolateObjects,
    removePropertyFilter,
    setPropertyFilter,
    applyPropertyFilter,
    unApplyPropertyFilter,
    waitForAvailableFilter
  } = useFilterUtilities()

  return (state: SerializedViewerState, mode: StateApplyMode) => {
    position.value = new Vector3(
      state.ui.camera.position[0],
      state.ui.camera.position[1],
      state.ui.camera.position[2]
    )
    target.value = new Vector3(
      state.ui.camera.target[0],
      state.ui.camera.target[1],
      state.ui.camera.target[2]
    )

    isOrthoProjection.value = state.ui.camera.isOrthoProjection

    sectionBox.value = state.ui.sectionBox
      ? new Box3(
          new Vector3(
            state.ui.sectionBox.min[0],
            state.ui.sectionBox.min[1],
            state.ui.sectionBox.min[2]
          ),
          new Vector3(
            state.ui.sectionBox.max[0],
            state.ui.sectionBox.max[1],
            state.ui.sectionBox.max[2]
          )
        )
      : null

    const filters = state.ui.filters
    if (filters.hiddenObjectIds.length) {
      resetFilters()
      hideObjects(filters.hiddenObjectIds, { replace: true })
    } else if (filters.isolatedObjectIds.length) {
      resetFilters()
      isolateObjects(filters.isolatedObjectIds, { replace: true })
    } else {
      resetFilters()
    }

    const propertyFilterApplied = state.ui.filters.propertyFilter.isApplied
    if (propertyFilterApplied) {
      applyPropertyFilter()
    } else {
      unApplyPropertyFilter()
    }

    const propertyInfoKey = state.ui.filters.propertyFilter.key
    const passMin = state.viewer.metadata.filteringState?.passMin
    const passMax = state.viewer.metadata.filteringState?.passMax
    if (propertyInfoKey) {
      removePropertyFilter()

      // Setting property filter asynchronously, when it's possible to do so
      waitForAvailableFilter(propertyInfoKey)
        .then((filter) => {
          if (passMin || passMax) {
            const numericFilter = { ...filter } as NumericPropertyInfo
            numericFilter.passMin = passMin || numericFilter.min
            numericFilter.passMax = passMax || numericFilter.max
            setPropertyFilter(numericFilter)
            applyPropertyFilter()
          } else {
            setPropertyFilter(filter)
            applyPropertyFilter()
          }
        })
        .catch(console.error)
    }

    highlightedObjectIds.value =
      mode === StateApplyMode.Spotlight ? filters.selectedObjectIds.slice() : []

    if (
      [
        StateApplyMode.Spotlight,
        StateApplyMode.TheadFullContextOpen,
        StateApplyMode.Reset
      ].includes(mode)
    ) {
      resourceIdString.value = state.resources.request.resourceIdString
    }

    if (
      [
        StateApplyMode.Spotlight,
        StateApplyMode.TheadFullContextOpen,
        StateApplyMode.Reset
      ].includes(mode)
    ) {
      urlHashState.focusedThreadId.value = state.ui.threads.openThread.threadId
    }

    explodeFactor.value = state.ui.explodeFactor
    lightConfig.value = {
      ...lightConfig.value,
      ...state.ui.lightConfig
    }
  }
}
