import { difference, isEqual, uniq } from 'lodash-es'
import { useThrottleFn, onKeyStroke, watchTriggerable } from '@vueuse/core'
import {
  ExplodeEvent,
  ExplodeExtension,
  LoaderEvent,
  type PropertyInfo,
  type StringPropertyInfo,
  type SunLightConfiguration,
  FilteringExtension,
  DiffExtension,
  MeasurementsExtension
} from '@speckle/viewer'
import {
  ViewerEvent,
  VisualDiffMode,
  CameraController,
  UpdateFlags,
  SectionOutlines,
  SectionToolEvent,
  SectionTool,
  SpeckleLoader,
  SelectionExtension
} from '@speckle/viewer'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import type { ViewerResourceItem } from '~~/lib/common/generated/gql/graphql'
import { ProjectCommentsUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import {
  useInjectedViewer,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useViewerSelectionEventHandler } from '~~/lib/viewer/composables/setup/selection'
import {
  useGetObjectUrl,
  useOnViewerLoadComplete,
  useViewerCameraControlStartTracker,
  useViewerCameraRestTracker,
  useViewerEventListener
} from '~~/lib/viewer/composables/viewer'
import { useViewerCommentUpdateTracking } from '~~/lib/viewer/composables/commentManagement'
import { getCacheId } from '~~/lib/common/helpers/graphql'
import {
  useViewerOpenedThreadUpdateEmitter,
  useViewerThreadTracking
} from '~~/lib/viewer/composables/commentBubbles'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { arraysEqual } from '~~/lib/common/helpers/utils'
import { Box3, Matrix3, Vector3 } from 'three'
import { areVectorsLooselyEqual } from '~~/lib/viewer/helpers/three'
import { SafeLocalStorage, type Nullable } from '@speckle/shared'
import {
  useCameraUtilities,
  useMeasurementUtilities
} from '~~/lib/viewer/composables/ui'
import { setupDebugMode } from '~~/lib/viewer/composables/setup/dev'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { OBB } from 'three/examples/jsm/math/OBB'
import type { SectionBoxData } from '@speckle/shared/viewer/state'
import { HighlightExtension } from '~/lib/viewer/extensions/HighlightExtension'

function useViewerLoadCompleteEventHandler() {
  const state = useInjectedViewerState()

  const callback = () => {
    state.ui.loading.value = false
  }
  onMounted(() => {
    state.viewer.instance.on(ViewerEvent.LoadComplete, callback)
  })

  onBeforeUnmount(() => {
    state.viewer.instance.removeListener(ViewerEvent.LoadComplete, callback)
  })
}

/**
 * Automatically loads & unloads objects into the viewer depending on the global URL resource identifier state
 */
function useViewerObjectAutoLoading() {
  if (import.meta.server) return

  const disableViewerCache =
    SafeLocalStorage.get('FE2_FORCE_DISABLE_VIEWER_CACHE') === 'true'
  const { effectiveAuthToken } = useAuthManager()
  const getObjectUrl = useGetObjectUrl()
  const {
    projectId,
    viewer: {
      instance: viewer,
      init: { ref: isInitialized },
      hasDoneInitialLoad
    },
    resources: {
      response: { resourceItems }
    },
    ui: { loadProgress, loading },
    urlHashState: { focusedThreadId }
  } = useInjectedViewerState()

  const loadingProgressMap: { [id: string]: number } = {}

  viewer.on(ViewerEvent.LoadComplete, (id) => {
    delete loadingProgressMap[id]
    consolidateProgressInternal({ id, progress: 1 })
  })

  const consolidateProgressInternal = (args: { progress: number; id: string }) => {
    loadingProgressMap[args.id] = args.progress
    const values = Object.values(loadingProgressMap)
    const min = values.length ? Math.min(...values) : 1

    loadProgress.value = min
    loading.value = min < 1
  }

  const consolidateProgressThorttled = useThrottleFn(consolidateProgressInternal, 250)

  const loadObject = async (
    objectId: string,
    unload?: boolean,
    options?: Partial<{ zoomToObject: boolean }>
  ) => {
    const objectUrl = getObjectUrl(projectId.value, objectId)

    if (unload) {
      return viewer.unloadObject(objectUrl)
    } else {
      const loader = new SpeckleLoader(
        viewer.getWorldTree(),
        objectUrl,
        effectiveAuthToken.value || undefined,
        disableViewerCache ? false : undefined,
        undefined
      )

      loader.on(LoaderEvent.LoadProgress, (args) => {
        consolidateProgressThorttled(args)
      })
      loader.on(LoaderEvent.LoadCancelled, (id) => {
        delete loadingProgressMap[id]
        consolidateProgressInternal({ id, progress: 1 })
      })

      return viewer.loadObject(loader, options?.zoomToObject)
    }
  }

  const getUniqueObjectIds = (resourceItems: ViewerResourceItem[]) =>
    uniq(resourceItems.map((i) => i.objectId))

  watch(
    () => <const>[resourceItems.value, isInitialized.value, hasDoneInitialLoad.value],
    async ([newResources, newIsInitialized, newHasDoneInitialLoad], oldData) => {
      // Wait till viewer loaded in
      if (!newIsInitialized) return

      const [oldResources] = oldData || [[], false]
      const zoomToObject = !focusedThreadId.value // we want to zoom to the thread instead

      // Viewer initialized - load in all resources
      if (!newHasDoneInitialLoad) {
        const allObjectIds = getUniqueObjectIds(newResources)

        /** Load sequentially */
        const res = []
        for (const i of allObjectIds) {
          res.push(await loadObject(i, false, { zoomToObject }))
        }
        /** Load in parallel */
        // const res = await Promise.all(
        //   allObjectIds.map((i) => loadObject(i, false, { zoomToObject }))
        // )
        if (res.length) {
          hasDoneInitialLoad.value = true
        }

        return
      }

      // Resources changed?
      const newObjectIds = getUniqueObjectIds(newResources)
      const oldObjectIds = getUniqueObjectIds(oldResources)
      const removableObjectIds = difference(oldObjectIds, newObjectIds)
      const addableObjectIds = difference(newObjectIds, oldObjectIds)

      await Promise.all(removableObjectIds.map((i) => loadObject(i, true)))
      await Promise.all(
        addableObjectIds.map((i) => loadObject(i, false, { zoomToObject: false }))
      )
    },
    { deep: true, immediate: true }
  )

  onBeforeUnmount(async () => {
    await viewer.unloadAll()
  })
}

/**
 * Here we make the viewer pretend it's a connector and send out receive events. Note, this is important for us to track to be able to get a picture of how much data is consumed
 * in our viewer.
 */
function useViewerReceiveTracking() {
  //
  const {
    resources: {
      response: { modelsAndVersionIds }
    }
  } = useInjectedViewerState()
  const mixpanel = useMixpanel()
  const { userId } = useActiveUser()
  const receivedVersions = new Set<string>()
  watch(modelsAndVersionIds, (newVal) => {
    for (const { model, versionId } of newVal) {
      if (receivedVersions.has(versionId)) {
        continue
      }
      receivedVersions.add(versionId)
      mixpanel.track('Receive', {
        hostApp: 'viewer',
        sourceHostApp: model.loadedVersion.items[0].sourceApplication,
        isMultiplayer: model.loadedVersion.items[0].authorUser?.id !== userId.value
      })
    }
  })
}

/**
 * Listening to model/version updates through subscriptions and making various
 * cache updates so that we don't need to always refetch queries
 */
function useViewerSubscriptionEventTracker() {
  if (import.meta.server) return

  const {
    projectId,
    resources: {
      request: { resourceIdString, threadFilters }
    }
  } = useInjectedViewerState()

  // Track all project/model/version updates
  useGeneralProjectPageUpdateTracking({
    projectId
  })

  // Also track updates to comments
  useViewerCommentUpdateTracking(
    {
      projectId,
      resourceIdString,
      loadedVersionsOnly: computed(() => threadFilters.value.loadedVersionsOnly)
    },
    (event, cache) => {
      const isArchived = event.type === ProjectCommentsUpdatedMessageType.Archived
      const isNew = event.type === ProjectCommentsUpdatedMessageType.Created
      const comment = event.comment

      if (isArchived) {
        // Mark as archived
        cache.modify({
          id: getCacheId('Comment', event.id),
          fields: {
            archived: () => true
          }
        })

        // Remove from project.commentThreads
        modifyObjectField(
          cache,
          getCacheId('Project', projectId.value),
          'commentThreads',
          ({ variables, helpers: { createUpdatedValue, readField } }) => {
            if (variables.filter?.includeArchived) return // we want it in that list

            return createUpdatedValue(({ update }) => {
              update('totalCount', (totalCount) => totalCount - 1)
              update('items', (items) =>
                items.filter((i) => readField(i, 'id') !== event.id)
              )
            })
          }
        )
      } else if (isNew && comment) {
        const parentId = comment.parent?.id

        // Add reply to parent
        if (parentId) {
          modifyObjectField(
            cache,
            getCacheId('Comment', parentId),
            'replies',
            ({ helpers: { createUpdatedValue, ref } }) =>
              createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => totalCount + 1)
                update('items', (items) => [ref('Comment', comment.id), ...items])
              })
          )
        } else {
          // Add comment thread
          modifyObjectField(
            cache,
            getCacheId('Project', projectId.value),
            'commentThreads',
            ({ helpers: { ref, createUpdatedValue, readField }, value }) => {
              // In case this is actually an unarchived comment, we only want to add it if it doesnt
              // exist in the includesArchived list already
              const includesItem = value.items?.find(
                (i) => readField(i, 'id') === comment.id
              )
              if (includesItem) return

              return createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => totalCount + 1)
                update('items', (items) => [ref('Comment', comment.id), ...items])
              })
            }
          )
        }
      }
    }
  )
}

function sectionBoxDataEquals(a: SectionBoxData, b: SectionBoxData): boolean {
  const isEqual = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
  return (
    isEqual(a.min, b.min) &&
    isEqual(a.max, b.max) &&
    (a.rotation && b.rotation ? isEqual(a.rotation, b.rotation) : true)
  )
}

function useViewerSectionBoxIntegration() {
  const {
    ui: {
      sectionBox,
      sectionBoxContext: { visible, edited }
    },
    viewer: { instance }
  } = useInjectedViewerState()

  // Change edited=true when user starts changing the section box by dragging it
  const sectionTool = instance.getExtension(SectionTool)
  const onDragStart = () => {
    edited.value = true
  }
  sectionTool.on(SectionToolEvent.DragStart, onDragStart)

  // No two-way sync for section boxes, because once you set a Box3 into the viewer
  // the viewer transforms it into something else causing the updates going into an infinite loop

  // state -> viewer
  watch(
    sectionBox,
    (newVal, oldVal) => {
      if (newVal && oldVal && sectionBoxDataEquals(newVal, oldVal)) return
      if (!newVal && !oldVal) return

      if (oldVal && !newVal) {
        visible.value = false
        edited.value = false

        sectionTool.enabled = false
        instance.requestRender(UpdateFlags.RENDER_RESET)
        return
      }

      if (newVal && (!oldVal || !sectionBoxDataEquals(newVal, oldVal))) {
        visible.value = true
        edited.value = false
        const aabb = new Box3(
          new Vector3().fromArray(newVal.min),
          new Vector3().fromArray(newVal.max)
        )
        const box = new OBB().fromBox3(aabb)
        if (newVal.rotation) box.rotation = new Matrix3().fromArray(newVal.rotation)

        sectionTool.setBox(box)
        sectionTool.enabled = true
        const outlines = instance.getExtension(SectionOutlines)
        if (outlines) outlines.requestUpdate()
        instance.requestRender(UpdateFlags.RENDER_RESET)
      }
    },
    { immediate: true, deep: true, flush: 'sync' }
  )

  watch(
    visible,
    (newVal, oldVal) => {
      if (newVal && oldVal) return
      if (!newVal && !oldVal) return

      if (newVal) {
        sectionTool.visible = true
      } else {
        sectionTool.visible = false
      }
      instance.requestRender()
    },
    { immediate: true, deep: true, flush: 'sync' }
  )

  onBeforeUnmount(() => {
    sectionTool.enabled = false
    sectionTool.removeListener(SectionToolEvent.DragStart, onDragStart)
  })
}

function useViewerCameraIntegration() {
  const {
    viewer: { instance },
    ui: {
      camera: { isOrthoProjection, position, target },
      spotlightUserSessionId
    }
  } = useInjectedViewerState()
  const { forceViewToViewerSync } = useCameraUtilities()

  const hasInitialLoadFired = ref(false)

  const loadCameraDataFromViewer = () => {
    const extension: CameraController = instance.getExtension(CameraController)
    let cameraManuallyChanged = false

    const viewerPos = new Vector3().copy(extension.getPosition())
    const viewerTarget = new Vector3().copy(extension.getTarget())

    if (!areVectorsLooselyEqual(position.value, viewerPos)) {
      if (hasInitialLoadFired.value) position.value = viewerPos.clone()
      cameraManuallyChanged = true
    }
    if (!areVectorsLooselyEqual(target.value, viewerTarget)) {
      if (hasInitialLoadFired.value) target.value = viewerTarget.clone()
      cameraManuallyChanged = true
    }

    return cameraManuallyChanged
  }

  // viewer -> state (update once camera interaction ends)
  useViewerCameraRestTracker(() => {
    loadCameraDataFromViewer()
  })

  useOnViewerLoadComplete(({ isInitial }) => {
    if (isInitial) {
      hasInitialLoadFired.value = true

      // Load camera position so we can return to it correctly
      // ONLY if we don't already have specific coordinates (e.g. from opened thread)
      // otherwise - load current pos/target into viewer
      const hasInitCoords =
        position.value.equals(new Vector3()) && target.value.equals(new Vector3())
      if (hasInitCoords) {
        loadCameraDataFromViewer()
      } else {
        forceViewToViewerSync()
      }

      // Only now set projection, we can't do it too early
      orthoProjectionUpdate(isOrthoProjection.value)
    } else {
      loadCameraDataFromViewer()
    }
  })

  useViewerCameraControlStartTracker(() => {
    if (spotlightUserSessionId.value) {
      spotlightUserSessionId.value = null // cancel
    }
  })

  const orthoProjectionUpdate = (newVal: boolean) => {
    if (!hasInitialLoadFired.value) {
      throw new Error('Attempting to set projection too early')
    }

    const camController = instance.getExtension(CameraController)
    if (newVal) {
      camController.setOrthoCameraOn()
    } else {
      camController.setPerspectiveCameraOn()
    }

    // reset camera pos, cause we've switched cameras now and it might not have the new ones
    forceViewToViewerSync()
  }

  // state -> viewer: update camera once when either position or target meaningfully changes
  watch(
    () => ({ pos: position.value.clone(), tgt: target.value.clone() }),
    (newVal, oldVal) => {
      if (
        oldVal &&
        areVectorsLooselyEqual(newVal.pos, oldVal.pos) &&
        areVectorsLooselyEqual(newVal.tgt, oldVal.tgt)
      )
        return

      const camController = instance.getExtension(CameraController)
      camController.setCameraView(
        {
          position: newVal.pos,
          target: newVal.tgt
        },
        true
      )
    },
    { immediate: true, deep: false }
  )

  // react to projection mode changes
  watch(
    isOrthoProjection,
    (newVal, oldVal) => {
      if (newVal === oldVal || !hasInitialLoadFired.value) return
      orthoProjectionUpdate(newVal)
    },
    { immediate: true }
  )
}

function useViewerFiltersIntegration() {
  const {
    viewer: { instance },
    ui: { filters, highlightedObjectIds }
  } = useInjectedViewerState()

  const selectionExt = instance.getExtension(SelectionExtension)
  const highlightExt = instance.getExtension(HighlightExtension)

  const preserveSelectionHighlightFilter = (filterFn: () => void) => {
    const selectedObjects = selectionExt
      .getSelectedObjects()
      .map((obj) => obj.id as string)
    const highlightedObjects = highlightedObjectIds.value.slice()

    if (!selectedObjects.length && !highlightedObjects.length) {
      filterFn()
      return
    }

    // Clear, apply, restore
    if (selectedObjects.length) selectionExt.clearSelection()
    if (highlightedObjects.length) highlightExt.clearSelection()

    filterFn()

    // Only restore selection (highlights should be cleared by filtering)
    if (selectedObjects.length) selectionExt.selectObjects(selectedObjects)
  }

  const {
    metadata: { availableFilters: allFilters }
  } = useInjectedViewer()

  const stateKey = 'default'
  let preventFilterWatchers = false
  const withWatchersDisabled = (fn: () => void) => {
    const isAlreadyInPreventScope = !!preventFilterWatchers
    preventFilterWatchers = true
    fn()
    if (!isAlreadyInPreventScope) preventFilterWatchers = false
  }

  const speckleTypeFilter = computed(
    () => allFilters.value?.find((f) => f.key === 'speckle_type') as StringPropertyInfo
  )

  // state -> viewer
  watch(
    highlightedObjectIds,
    (newVal, oldVal) => {
      if (arraysEqual(newVal, oldVal || [])) return

      if (!newVal.length) {
        instance.getExtension(HighlightExtension).clearSelection()
      } else {
        instance.getExtension(HighlightExtension).selectObjects(newVal)
      }
    },
    { immediate: true, flush: 'sync' }
  )

  watch(
    filters.isolatedObjectIds,
    (newVal, oldVal) => {
      if (preventFilterWatchers) return
      if (arraysEqual(newVal, oldVal || [])) return

      const isolatable = difference(newVal, oldVal || [])
      const unisolatable = difference(oldVal || [], newVal)

      if (isolatable.length) {
        withWatchersDisabled(() => {
          preserveSelectionHighlightFilter(() => {
            instance
              .getExtension(FilteringExtension)
              .isolateObjects(isolatable, stateKey, true)
            filters.hiddenObjectIds.value = []
          })
        })
      }

      if (unisolatable.length) {
        withWatchersDisabled(() => {
          preserveSelectionHighlightFilter(() => {
            instance
              .getExtension(FilteringExtension)
              .unIsolateObjects(unisolatable, stateKey, true)
            filters.hiddenObjectIds.value = []
          })
        })
      }
    },
    { immediate: true, flush: 'sync' }
  )

  watch(
    filters.hiddenObjectIds,
    (newVal, oldVal) => {
      if (preventFilterWatchers) return
      if (arraysEqual(newVal, oldVal || [])) return

      const hidable = difference(newVal, oldVal || [])
      const showable = difference(oldVal || [], newVal)

      if (hidable.length) {
        withWatchersDisabled(() => {
          preserveSelectionHighlightFilter(() => {
            instance
              .getExtension(FilteringExtension)
              .hideObjects(hidable, stateKey, true)
            filters.isolatedObjectIds.value = []
          })
        })
      }
      if (showable.length) {
        withWatchersDisabled(() => {
          preserveSelectionHighlightFilter(() => {
            instance
              .getExtension(FilteringExtension)
              .showObjects(showable, stateKey, true)
            filters.isolatedObjectIds.value = []
          })
        })
      }
    },
    { immediate: true, flush: 'sync' }
  )

  const syncColorFilterToViewer = async (
    filter: Nullable<PropertyInfo>,
    isApplied: boolean
  ) => {
    const targetFilter = filter || speckleTypeFilter.value

    preserveSelectionHighlightFilter(() => {
      const filteringExt = instance.getExtension(FilteringExtension)
      if (isApplied && targetFilter) filteringExt.setColorFilter(targetFilter)
      if (!isApplied) filteringExt.removeColorFilter()
    })
  }

  watch(
    () =>
      <const>[
        filters.propertyFilter.filter.value,
        filters.propertyFilter.isApplied.value
      ],
    async (newVal) => {
      const [filter, isApplied] = newVal
      await syncColorFilterToViewer(filter, isApplied)
    },
    { immediate: true, flush: 'sync' }
  )

  useOnViewerLoadComplete(
    async () => {
      const targetFilter =
        filters.propertyFilter.filter.value || speckleTypeFilter.value
      const isApplied = filters.propertyFilter.isApplied.value
      await syncColorFilterToViewer(targetFilter, isApplied)
    },
    { initialOnly: true }
  )
}

function useLightConfigIntegration() {
  const {
    ui: { lightConfig },
    viewer: { instance }
  } = useInjectedViewerState()

  // viewer -> state
  useViewerEventListener(
    ViewerEvent.LightConfigUpdated,
    (config: SunLightConfiguration) => {
      if (isEqual(lightConfig.value, config)) return
      lightConfig.value = config
    }
  )

  // state -> viewer
  watch(
    lightConfig,
    (newVal, oldVal) => {
      if (newVal && oldVal && isEqual(newVal, oldVal)) return
      instance.setLightConfiguration(newVal)
    },
    {
      immediate: true,
      deep: true,
      flush: 'sync'
    }
  )

  useOnViewerLoadComplete(
    () => {
      instance.setLightConfiguration(lightConfig.value)
    },
    { initialOnly: true }
  )
}

function useExplodeFactorIntegration() {
  const {
    ui: { explodeFactor },
    viewer: { instance }
  } = useInjectedViewerState()

  const updateOutlines = () => {
    const sectionOutlines = instance.getExtension(SectionOutlines)
    if (sectionOutlines && sectionOutlines.enabled) sectionOutlines.requestUpdate(true)
  }
  onMounted(() => {
    instance.getExtension(ExplodeExtension).on(ExplodeEvent.Finshed, updateOutlines)
  })

  onBeforeUnmount(() => {
    instance
      .getExtension(ExplodeExtension)
      .removeListener(ExplodeEvent.Finshed, updateOutlines)
  })

  // state -> viewer only. we don't need the reverse.
  watch(
    explodeFactor,
    (newVal) => {
      /** newVal comes in as a string, convert to number and apply */
      instance.getExtension(ExplodeExtension).setExplode(Number(newVal))
    },
    { immediate: true }
  )

  useOnViewerLoadComplete(
    () => {
      instance.getExtension(ExplodeExtension).setExplode(Number(explodeFactor.value))
    },
    { initialOnly: true }
  )
}

function useDiffingIntegration() {
  const state = useInjectedViewerState()
  const { effectiveAuthToken } = useAuthManager()
  const getObjectUrl = useGetObjectUrl()

  const hasInitialLoadFired = ref(false)

  const { trigger: triggerDiffCommandWatch } = watchTriggerable(
    () => <const>[state.ui.diff.oldVersion.value, state.ui.diff.newVersion.value],
    async (newVal, oldVal) => {
      if (!hasInitialLoadFired.value) return
      const [oldVersion, newVersion] = newVal
      const [oldOldVersion, oldNewVersion] = oldVal || [null, null]

      const versionId = (version: typeof oldOldVersion) => version?.id || null
      const commandId = (
        oldVersion: typeof oldOldVersion,
        newVersion: typeof oldOldVersion
      ) => {
        const oldId = versionId(oldVersion)
        const newId = versionId(newVersion)
        return oldId && newId ? `${oldId}->${newId}` : null
      }

      const newCommand = commandId(oldVersion, newVersion)
      const oldCommand = commandId(oldOldVersion, oldNewVersion)

      if ((newCommand && oldCommand === newCommand) || !!newCommand === !!oldCommand)
        return

      if (!newCommand || oldVal) {
        await state.viewer.instance.getExtension(DiffExtension).undiff()
        if (!newCommand) return
      }

      // values shouldn't be undefined cause commandId() generation succeeded
      const oldObjUrl = getObjectUrl(
        state.projectId.value,
        oldVersion?.referencedObject as string
      )
      const newObjUrl = getObjectUrl(
        state.projectId.value,
        newVersion?.referencedObject as string
      )

      const diffExt = state.viewer.instance.getExtension(DiffExtension)
      state.ui.diff.result.value = await diffExt.diff(
        oldObjUrl,
        newObjUrl,
        state.ui.diff.mode.value,
        effectiveAuthToken.value
      )
    },
    { immediate: true }
  )

  // const preventWatchers = 0
  watch(state.ui.diff.result, (val) => {
    if (!val) return
    // reset visual diff time and mode on new diff result
    // sometimes the watcher won't fire even when the values are updated, because they're updated to
    // the same values that they were already. because of that we're manually & forcefully running
    // the relevant watchers when diffResult changes
    ignoreDiffModeUpdates(() => {
      ignoreDiffTimeUpdates(() => {
        state.ui.diff.time.value = 0.5
        state.ui.diff.mode.value = VisualDiffMode.COLORED

        // this watcher also updates diffTime, so no need to invoke that separately
        triggerDiffModeWatch()
      })
    })
  })

  const { ignoreUpdates: ignoreDiffTimeUpdates } = watchTriggerable(
    state.ui.diff.time,
    (val) => {
      if (!hasInitialLoadFired.value) return
      if (!state.ui.diff.result.value) return

      state.viewer.instance.getExtension(DiffExtension).updateVisualDiff(val)
    }
  )

  const { trigger: triggerDiffModeWatch, ignoreUpdates: ignoreDiffModeUpdates } =
    watchTriggerable(state.ui.diff.mode, (val) => {
      if (!hasInitialLoadFired.value) return
      if (!state.ui.diff.result.value) return

      const diffExt = state.viewer.instance.getExtension(DiffExtension)
      diffExt.updateVisualDiff(undefined, val)
      diffExt.updateVisualDiff(state.ui.diff.time.value)
    })

  useOnViewerLoadComplete(({ isInitial }) => {
    if (!isInitial) return
    hasInitialLoadFired.value = true

    triggerDiffCommandWatch()
  })
}

function useViewerMeasurementIntegration() {
  const {
    ui: { measurement },
    viewer: { instance }
  } = useInjectedViewerState()

  const { clearMeasurements, removeMeasurement } = useMeasurementUtilities()

  onBeforeUnmount(() => {
    clearMeasurements()
  })

  watch(
    () => measurement.enabled.value,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        instance.getExtension(MeasurementsExtension).enabled = newVal
      }
    },
    { immediate: true }
  )

  watch(
    () => ({ ...measurement.options.value }),
    (newMeasurementState) => {
      if (newMeasurementState) {
        instance.getExtension(MeasurementsExtension).options = newMeasurementState
      }
    },
    { immediate: true, deep: true }
  )

  onKeyStroke('Delete', () => {
    removeMeasurement()
  })
  onKeyStroke('Backspace', () => {
    removeMeasurement()
  })
}

function useDisableZoomOnEmbed() {
  const { viewer } = useInjectedViewerState()
  const embedOptions = useEmbed()

  watch(
    () => embedOptions.noScroll.value,
    (newNoScrollValue) => {
      const cameraController: CameraController =
        viewer.instance.getExtension(CameraController)

      if (newNoScrollValue) {
        cameraController.options = { enableZoom: false }
      } else {
        cameraController.options = { enableZoom: true }
      }
    },
    { immediate: true }
  )
}

export function useViewerPostSetup() {
  if (import.meta.server) return
  useViewerObjectAutoLoading()
  useViewerReceiveTracking()
  useViewerSelectionEventHandler()
  useViewerLoadCompleteEventHandler()
  useViewerSubscriptionEventTracker()
  useViewerThreadTracking()
  useViewerOpenedThreadUpdateEmitter()
  useViewerSectionBoxIntegration()
  useViewerCameraIntegration()
  useViewerFiltersIntegration()
  useLightConfigIntegration()
  useExplodeFactorIntegration()
  useDiffingIntegration()
  useViewerMeasurementIntegration()
  useDisableZoomOnEmbed()
  setupDebugMode()
}
