import {
  useInjectedViewerState,
  useResetUiState
} from '~~/lib/viewer/composables/setup'
import { SpeckleViewer, TimeoutError } from '@speckle/shared'
import { get } from 'lodash-es'
import { Vector3, Box3 } from 'three'
import {
  useDiffUtilities,
  useFilterUtilities,
  useSelectionUtilities
} from '~~/lib/viewer/composables/ui'
import { CameraController } from '@speckle/viewer'
import type { NumericPropertyInfo } from '@speckle/viewer'

type SerializedViewerState = SpeckleViewer.ViewerState.SerializedViewerState

export function useStateSerialization() {
  const state = useInjectedViewerState()
  const { serializeDiffCommand } = useDiffUtilities()

  /**
   * We don't want to save a comment w/ implicit identifiers like ones that only have a model ID or a folder prefix, because
   * those can resolve to completely different versions/objects as time goes on
   */
  const buildConcreteResourceIdString = () => {
    const resources = state.resources.response.resourceItems
    const builder = SpeckleViewer.ViewerRoute.resourceBuilder()

    for (const resource of resources.value) {
      if (resource.modelId && resource.versionId) {
        builder.addModel(resource.modelId, resource.versionId)
      } else {
        builder.addObject(resource.objectId)
      }
    }

    const finalString = builder.toString()
    return finalString || state.resources.request.resourceIdString.value
  }

  const serialize = (
    options?: Partial<{
      /**
       * Instead of saving the current resourceIdString value, build a more concrete one that specifies exact version & object ids, so that the
       * string doesn't resolve to different objects in the future. Useful when serializing state for posterity (e.g. for new comment threads)
       */
      concreteResourceIdString: boolean
    }>
  ): SerializedViewerState => {
    const { concreteResourceIdString } = options || {}

    const camControls = state.viewer.instance.getExtension(CameraController).controls
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
          resourceIdString: concreteResourceIdString
            ? buildConcreteResourceIdString()
            : state.resources.request.resourceIdString.value,
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
        diff: {
          command: state.urlHashState.diff.value
            ? serializeDiffCommand(state.urlHashState.diff.value)
            : null,
          time: state.ui.diff.time.value,
          mode: state.ui.diff.mode.value
        },
        spotlightUserSessionId: state.ui.spotlightUserSessionId.value,
        filters: {
          isolatedObjectIds: state.ui.filters.isolatedObjectIds.value,
          hiddenObjectIds: state.ui.filters.hiddenObjectIds.value,
          selectedObjectIds: [...state.ui.filters.selectedObjectIds.value.values()],
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
        selection: state.ui.selection.value?.toArray() || null,
        measurement: {
          enabled: state.ui.measurement.enabled.value,
          options: state.ui.measurement.options.value
        }
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
      lightConfig,
      diff
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
  const resetState = useResetUiState()
  const { diffModelVersions, deserializeDiffCommand, endDiff } = useDiffUtilities()
  const { setSelectionFromObjectIds } = useSelectionUtilities()
  const logger = useLogger()

  return async (state: SerializedViewerState, mode: StateApplyMode) => {
    if (mode === StateApplyMode.Reset) {
      resetState()
      return
    }

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
        .catch((e) => {
          if (e instanceof TimeoutError) {
            logger.warn(
              `${e.message} - filter probably comes from a thread context that isn't currently loaded`
            )
          } else {
            logger.error(e)
          }
        })
    }

    if (mode === StateApplyMode.Spotlight) {
      highlightedObjectIds.value = filters.selectedObjectIds.slice()
    } else {
      if (filters.selectedObjectIds.length) {
        setSelectionFromObjectIds(filters.selectedObjectIds)
      }
    }

    if (
      [StateApplyMode.Spotlight, StateApplyMode.TheadFullContextOpen].includes(mode)
    ) {
      await resourceIdString.update(state.resources.request.resourceIdString)
    }

    if ([StateApplyMode.Spotlight].includes(mode)) {
      await urlHashState.focusedThreadId.update(state.ui.threads.openThread.threadId)
    }

    const command = state.ui.diff.command
      ? deserializeDiffCommand(state.ui.diff.command)
      : null
    const activeDiffEnabled = !!diff.enabled.value
    if (command && command.diffs.length) {
      diff.time.value = state.ui.diff.time
      diff.mode.value = state.ui.diff.mode

      const instruction = command.diffs[0]
      await diffModelVersions(
        instruction.versionA.modelId,
        instruction.versionA.versionId,
        instruction.versionB.versionId
      )
    } else if (!activeDiffEnabled || mode === StateApplyMode.Spotlight) {
      await endDiff()
    }

    explodeFactor.value = state.ui.explodeFactor
    lightConfig.value = {
      ...lightConfig.value,
      ...state.ui.lightConfig
    }
  }
}
