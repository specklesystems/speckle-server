import {
  useInjectedViewerState,
  useResetUiState
} from '~~/lib/viewer/composables/setup'
import { isUndefinedOrVoid, SpeckleViewer, TimeoutError } from '@speckle/shared'
import { get } from 'lodash-es'
import { Vector3 } from 'three'
import {
  useDiffUtilities,
  useFilterUtilities,
  useSelectionUtilities
} from '~~/lib/viewer/composables/ui'
import { CameraController, VisualDiffMode } from '@speckle/viewer'
import type { NumericPropertyInfo } from '@speckle/viewer'
import type { Merge, PartialDeep } from 'type-fest'
import { defaultMeasurementOptions } from '@speckle/shared/viewer/state'
import { useViewerRealtimeActivityTracker } from '~/lib/viewer/composables/activity'
import {
  isModelResource,
  resourceBuilder,
  type ViewerResource
} from '@speckle/shared/viewer/route'
import { until } from '@vueuse/core'

type SerializedViewerState = SpeckleViewer.ViewerState.SerializedViewerState

export function useStateSerialization() {
  const state = useInjectedViewerState()
  const { objects: selectedObjects } = useSelectionUtilities()
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
          selectedObjectApplicationIds: selectedObjects.value.reduce((ret, obj) => {
            ret[obj.id] = obj.applicationId ?? null
            return ret
          }, {} as Record<string, string | null>),
          propertyFilter: {
            key: state.ui.filters.propertyFilter.filter.value?.key || null,
            isApplied: state.ui.filters.propertyFilter.isApplied.value
          }
        },
        camera: {
          position: state.ui.camera.position.value.toArray(),
          target: state.ui.camera.target.value.toArray(),
          isOrthoProjection: state.ui.camera.isOrthoProjection.value,
          zoom: (get(camControls, '_zoom') as unknown as number) || 1 // kinda hacky, _zoom is a protected prop
        },
        viewMode: {
          mode: state.ui.viewMode.mode.value,
          edgesEnabled: state.ui.viewMode.edgesEnabled.value,
          edgesWeight: state.ui.viewMode.edgesWeight.value,
          outlineOpacity: state.ui.viewMode.outlineOpacity.value,
          edgesColor: state.ui.viewMode.edgesColor.value
        },
        sectionBox: state.ui.sectionBox.value ? box : null,
        lightConfig: { ...state.ui.lightConfig.value },
        explodeFactor: state.ui.explodeFactor.value,
        selection: state.ui.selection.value?.toArray() || null,
        measurement: {
          enabled: state.ui.measurement.enabled.value,
          options: state.ui.measurement.options.value,
          measurements: state.ui.measurement.measurements.value.slice()
        }
      }
    }
    return ret
  }

  return { serialize, buildConcreteResourceIdString }
}

export enum StateApplyMode {
  Spotlight,
  ThreadOpen,
  ThreadFullContextOpen,
  Reset,
  FederatedContext,
  SavedView
}

export type StateApplyOptions = Merge<
  Record<StateApplyMode, never>,
  {
    [StateApplyMode.SavedView]: { loadOriginal: boolean }
  }
>

export function useApplySerializedState() {
  const {
    projectId,
    ui: {
      camera: { position, target, isOrthoProjection },
      sectionBox,
      highlightedObjectIds,
      explodeFactor,
      lightConfig,
      diff,
      viewMode,
      measurement,
      sectionBoxContext,
      loading
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
  const { update } = useViewerRealtimeActivityTracker()

  return async <Mode extends StateApplyMode>(
    state: PartialDeep<SerializedViewerState>,
    mode: Mode,
    options?: StateApplyOptions[Mode]
  ) => {
    if (mode === StateApplyMode.Reset) {
      resetState()
      update() // Trigger activity update
      return
    }

    if (state.projectId && state.projectId !== projectId.value) {
      await projectId.update(state.projectId)
    }

    // Handle loaded resource change
    let newResourceIdString: string | undefined = undefined
    if (
      [StateApplyMode.Spotlight, StateApplyMode.ThreadFullContextOpen].includes(mode)
    ) {
      newResourceIdString = state.resources?.request?.resourceIdString || ''
    } else if (mode === StateApplyMode.SavedView) {
      const { loadOriginal } = options || {}

      const current = resourceBuilder().addResources(resourceIdString.value)
      const incoming = resourceBuilder().addResources(
        state.resources?.request?.resourceIdString || ''
      )

      const finalItems: ViewerResource[] = []
      for (const incomingItem of incoming) {
        if (!isModelResource(incomingItem)) {
          finalItems.push(incomingItem)
          continue
        }

        // Update versionId based on loadOriginal
        incomingItem.versionId = loadOriginal
          ? incomingItem.versionId
          : current
              .filter(isModelResource)
              .find((r) => r.modelId === incomingItem.modelId)?.versionId
        finalItems.push(incomingItem)
      }
      newResourceIdString = resourceBuilder()
        .addResources(finalItems)
        // .addNew(current) // keeping other federated models around
        .toString()
    } else if (mode === StateApplyMode.FederatedContext) {
      // For federated context, append only model IDs (without versions) to show latest
      const { parseUrlParameters, ViewerModelResource, createGetParamFromResources } =
        SpeckleViewer.ViewerRoute

      const currentResources = parseUrlParameters(resourceIdString.value)
      const newResources = parseUrlParameters(
        state.resources?.request?.resourceIdString ?? ''
      ).map((resource) => {
        if (resource instanceof ViewerModelResource) {
          // Only keep model ID, drop version
          return new ViewerModelResource(resource.modelId)
        }
        return resource
      })

      if (newResources.length) {
        const allResources = [...currentResources, ...newResources]
        newResourceIdString = createGetParamFromResources(allResources)
      }
    }

    // We want to make sure the final resources have been loaded before we continue on
    // with applying the rest of the state
    if (newResourceIdString) {
      await until(loading).toBe(false)
      await resourceIdString.update(newResourceIdString)
      await until(loading).toBe(false)
    }

    position.value = new Vector3(
      state.ui?.camera?.position?.[0],
      state.ui?.camera?.position?.[1],
      state.ui?.camera?.position?.[2]
    )
    target.value = new Vector3(
      state.ui?.camera?.target?.[0],
      state.ui?.camera?.target?.[1],
      state.ui?.camera?.target?.[2]
    )

    isOrthoProjection.value = !!state.ui?.camera?.isOrthoProjection

    sectionBox.value = state.ui?.sectionBox
      ? {
          min: state.ui.sectionBox.min || [],
          max: state.ui.sectionBox.max || [],
          rotation: state.ui.sectionBox.rotation || []
        }
      : null
    sectionBoxContext.visible.value = false
    if (!sectionBox.value) {
      sectionBoxContext.edited.value = false
    }

    const filters = state.ui?.filters || {}
    if (filters.hiddenObjectIds?.length) {
      resetFilters()
      hideObjects(filters.hiddenObjectIds, { replace: true })
    } else if (filters.isolatedObjectIds?.length) {
      resetFilters()
      isolateObjects(filters.isolatedObjectIds, { replace: true })
    } else {
      resetFilters()
    }

    const propertyFilterApplied = filters.propertyFilter?.isApplied
    if (propertyFilterApplied) {
      applyPropertyFilter()
    } else {
      unApplyPropertyFilter()
    }

    const propertyInfoKey = filters.propertyFilter?.key
    const passMin = state.viewer?.metadata?.filteringState?.passMin
    const passMax = state.viewer?.metadata?.filteringState?.passMax
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

    if ([StateApplyMode.Spotlight, StateApplyMode.SavedView].includes(mode)) {
      await urlHashState.focusedThreadId.update(
        state.ui?.threads?.openThread?.threadId || null
      )
    }

    const selectedObjectIds = Object.keys(filters.selectedObjectApplicationIds ?? {})
    if (mode === StateApplyMode.Spotlight) {
      highlightedObjectIds.value = selectedObjectIds
    } else {
      if (selectedObjectIds.length || mode === StateApplyMode.SavedView) {
        setSelectionFromObjectIds(selectedObjectIds)
      }
    }

    const command = state.ui?.diff?.command
      ? deserializeDiffCommand(state.ui.diff.command)
      : null
    const activeDiffEnabled = !!diff.enabled.value
    if (command && command.diffs.length && state.ui?.diff) {
      diff.time.value = state.ui.diff.time || 0.5
      diff.mode.value = state.ui?.diff.mode || VisualDiffMode.COLORED

      const instruction = command.diffs[0]
      await diffModelVersions(
        instruction.versionA.modelId,
        instruction.versionA.versionId,
        instruction.versionB.versionId
      )
    } else if (!activeDiffEnabled || mode === StateApplyMode.Spotlight) {
      await endDiff()
    }

    // Restore view mode
    if (!isUndefinedOrVoid(state.ui?.viewMode?.mode))
      viewMode.mode.value = state.ui!.viewMode!.mode
    if (!isUndefinedOrVoid(state.ui?.viewMode?.edgesEnabled))
      viewMode.edgesEnabled.value = state.ui!.viewMode!.edgesEnabled
    if (!isUndefinedOrVoid(state.ui?.viewMode?.edgesWeight))
      viewMode.edgesWeight.value = state.ui!.viewMode!.edgesWeight
    if (!isUndefinedOrVoid(state.ui?.viewMode?.outlineOpacity))
      viewMode.outlineOpacity.value = state.ui!.viewMode!.outlineOpacity
    if (!isUndefinedOrVoid(state.ui?.viewMode?.edgesColor))
      viewMode.edgesColor.value = state.ui!.viewMode!.edgesColor

    explodeFactor.value = state.ui?.explodeFactor || 0
    lightConfig.value = {
      ...lightConfig.value,
      ...(state.ui?.lightConfig || {})
    }

    // Apply measurements
    const incomingMeasurement = state.ui?.measurement
    if (incomingMeasurement) {
      if (!isUndefinedOrVoid(incomingMeasurement.enabled)) {
        measurement.enabled.value = incomingMeasurement.enabled
      }
      if (!isUndefinedOrVoid(incomingMeasurement.options)) {
        measurement.options.value = {
          ...defaultMeasurementOptions,
          ...incomingMeasurement.options
        }
      }
      if (!isUndefinedOrVoid(incomingMeasurement.measurements)) {
        measurement.measurements.value = incomingMeasurement.measurements
      }
    }

    // Trigger activity update
    update()
  }
}
