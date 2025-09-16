import { difference, flatten, isEqual, uniq } from 'lodash-es'
import {
  useThrottleFn,
  watchTriggerable,
  useMagicKeys,
  useEventListener
} from '@vueuse/core'
import {
  ViewerEvent,
  VisualDiffMode,
  CameraController,
  UpdateFlags,
  SectionOutlines,
  SectionToolEvent,
  SectionTool,
  SpeckleLoader,
  ExplodeEvent,
  ExplodeExtension,
  LoaderEvent,
  SelectionExtension,
  type SunLightConfiguration
} from '@speckle/viewer'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import type { ViewerResourceItem } from '~~/lib/common/generated/gql/graphql'
import { ProjectCommentsUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import {
  useInjectedViewerState,
  useInjectedViewerInterfaceState
} from '~~/lib/viewer/composables/setup'
import { useViewerSelectionEventHandler } from '~~/lib/viewer/composables/setup/selection'
import {
  useGetObjectUrl,
  useOnViewerLoadComplete,
  useViewerCameraControlStartTracker,
  useViewerCameraTracker,
  useViewerEventListener
} from '~~/lib/viewer/composables/viewer'
import { useViewerCommentUpdateTracking } from '~~/lib/viewer/composables/commentManagement'
import { getCacheId } from '~~/lib/common/helpers/graphql'
import {
  useViewerOpenedThreadUpdateEmitter,
  useViewerThreadTracking
} from '~~/lib/viewer/composables/commentBubbles'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { arraysEqual, isNonNullable } from '~~/lib/common/helpers/utils'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { Vector3 } from 'three'
import { areVectorsLooselyEqual } from '~~/lib/viewer/helpers/three'
import { SafeLocalStorage } from '@speckle/shared'
import { useCameraUtilities } from '~~/lib/viewer/composables/ui'
import { setupDebugMode } from '~~/lib/viewer/composables/setup/dev'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { SectionBoxData } from '@speckle/shared/viewer/state'
import { graphql } from '~/lib/common/generated/gql'
import { useTreeManagement } from '~~/lib/viewer/composables/tree'
import { useViewerSavedViewIntegration } from '~/lib/viewer/composables/savedViews/state'
import { useViewModesPostSetup } from '~/lib/viewer/composables/setup/viewMode'
import { useMeasurementsPostSetup } from '~/lib/viewer/composables/setup/measurements'
import { useFilterColoringPostSetup } from '~/lib/viewer/composables/setup/coloring'
import {
  usePropertyFilteringPostSetup,
  useManualFilteringPostSetup
} from '~/lib/viewer/composables/setup/filters'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { useFilteringSetup } from '~/lib/viewer/composables/filtering/setup'
import { useHighlightingPostSetup } from '~/lib/viewer/composables/setup/highlighting'

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
      request: {
        savedView: { id: savedViewId }
      },
      response: { resourceItems, savedView }
    },
    ui: { loadProgress, loading, spotlightUserSessionId },
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

      // we dont want to zoom to object, if we're loading specific coords because of a thread,
      // or spotlight mode or a saved view etc.
      const preventZooming =
        focusedThreadId.value ||
        savedViewId.value ||
        savedView.value ||
        spotlightUserSessionId.value
      const zoomToObject = !preventZooming

      // Viewer initialized - load in all resources
      if (!newHasDoneInitialLoad) {
        const allObjectIds = getUniqueObjectIds(newResources)

        /** Load sequentially */
        const res = []
        for (const i of allObjectIds) {
          res.push(await loadObject(i, false, { zoomToObject }))
        }

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

        instance.sectionBoxOff()
        instance.requestRender(UpdateFlags.RENDER_RESET)
        return
      }

      if (newVal && (!oldVal || !sectionBoxDataEquals(newVal, oldVal))) {
        visible.value = true
        edited.value = false

        instance.setSectionBox(newVal)
        instance.sectionBoxOn()
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
    instance.sectionBoxOff()
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

  // viewer -> state
  // debouncing pos/target updates to avoid jitteriness + spotlight mode unnecessarily disabling
  useViewerCameraTracker(
    () => {
      loadCameraDataFromViewer()
    },
    { throttleWait: 100 }
  )

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

    if (newVal) {
      instance.setOrthoCameraOn()
    } else {
      instance.setPerspectiveCameraOn()
    }

    // reset camera pos, cause we've switched cameras now and it might not have the new ones
    forceViewToViewerSync()
  }

  // state -> viewer
  watch(
    isOrthoProjection,
    (newVal, oldVal) => {
      if (newVal === oldVal || !hasInitialLoadFired.value) return
      orthoProjectionUpdate(newVal)
    },
    { immediate: true }
  )

  watch(
    position,
    (newVal, oldVal) => {
      if ((!newVal && !oldVal) || (oldVal && areVectorsLooselyEqual(newVal, oldVal))) {
        return
      }
      instance.setView({
        position: newVal,
        target: target.value
      })
    }
    // { immediate: true }
  )

  watch(
    target,
    (newVal, oldVal) => {
      if ((!newVal && !oldVal) || (oldVal && areVectorsLooselyEqual(newVal, oldVal))) {
        return
      }

      instance.setView({
        position: position.value,
        target: newVal
      })
    }
    // { immediate: true }
  )
}

function useViewerFiltersIntegration() {
  const state = useInjectedViewerState()
  const {
    viewer: { instance },
    ui: { filters }
  } = state

  useFilteringSetup()
  useFilterUtilities({ state })

  watch(
    filters.selectedObjects,
    (newVal, oldVal) => {
      const newIds = flatten(newVal.map((v) => getTargetObjectIds({ ...v }))).filter(
        isNonNullable
      )
      const oldIds = flatten(
        (oldVal || []).map((v) => getTargetObjectIds({ ...v }))
      ).filter(isNonNullable)
      if (arraysEqual(newIds, oldIds)) return

      state.ui.highlightedObjectIds.value = []

      const selectionExtension = instance.getExtension(SelectionExtension)

      if (!newVal.length) {
        selectionExtension.clearSelection()
        return
      }
      selectionExtension.selectObjects(newIds)
    },
    { immediate: true, flush: 'sync' }
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
      /** newVal turns out to be a string. It needs to be a */
      instance.explode(newVal)
    },
    { immediate: true }
  )

  useOnViewerLoadComplete(
    () => {
      instance.explode(explodeFactor.value)
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
        await state.viewer.instance.undiff()
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

      state.ui.diff.result.value = await state.viewer.instance.diff(
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

      state.viewer.instance.setDiffTime(state.ui.diff.result.value, val)
    }
  )

  const { trigger: triggerDiffModeWatch, ignoreUpdates: ignoreDiffModeUpdates } =
    watchTriggerable(state.ui.diff.mode, (val) => {
      if (!hasInitialLoadFired.value) return
      if (!state.ui.diff.result.value) return

      state.viewer.instance.setVisualDiffMode(state.ui.diff.result.value, val)
      state.viewer.instance.setDiffTime(
        state.ui.diff.result.value,
        state.ui.diff.time.value
      ) // hmm, why do i need to call diff time again? seems like a minor viewer bug
    })

  useOnViewerLoadComplete(({ isInitial }) => {
    if (!isInitial) return
    hasInitialLoadFired.value = true

    triggerDiffCommandWatch()
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

function useViewerTreeIntegration() {
  const { viewer } = useInjectedViewerState()
  const { treeStateManager } = useTreeManagement()

  // Initialize the tree state manager with viewer instance
  onMounted(() => treeStateManager.initialize(viewer.instance))
}

graphql(`
  fragment UseViewerSavedViewSetup_SavedView on SavedView {
    id
    viewerState
  }
`)

function useViewerCursorIntegration() {
  const {
    viewer: { container }
  } = useInjectedViewerState()

  const {
    filters: { selectedObjects }
  } = useInjectedViewerInterfaceState()

  const { shift } = useMagicKeys()
  const isDragging = ref(false)

  // Handle mouse down/up to track dragging state
  const handlePointerDown = (_event: PointerEvent) => {
    if (shift.value && selectedObjects.value.length === 0) {
      isDragging.value = true
    }
  }

  const handlePointerUp = () => {
    isDragging.value = false
  }

  // Show different cursors: grab (ready to drag) vs grabbing (actively dragging)
  watch(
    [shift, selectedObjects, isDragging],
    () => {
      if (!container) return

      const hasSelection = selectedObjects.value.length > 0
      const shouldShowDrag = shift.value && !hasSelection

      if (shouldShowDrag) {
        container.style.cursor = isDragging.value ? 'grabbing' : 'grab'
      } else {
        container.style.cursor = ''
      }
    },
    { immediate: true }
  )

  useEventListener(container, 'pointerdown', handlePointerDown, { passive: true })
  useEventListener(document, 'pointerup', handlePointerUp, { passive: true })

  onBeforeUnmount(() => {
    if (container) {
      container.style.cursor = ''
    }
  })
}

export function useViewerPostSetup() {
  if (import.meta.server) return
  useViewerObjectAutoLoading()
  useViewerSavedViewIntegration()
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
  useMeasurementsPostSetup()
  useFilterColoringPostSetup()
  usePropertyFilteringPostSetup()
  useManualFilteringPostSetup()
  useDisableZoomOnEmbed()
  useViewerCursorIntegration()
  useViewerTreeIntegration()
  useViewModesPostSetup()
  useHighlightingPostSetup()
  setupDebugMode()
}
