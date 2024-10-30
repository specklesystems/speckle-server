import { difference, flatten, isEqual, uniq } from 'lodash-es'
import {
  ViewerEvent,
  VisualDiffMode,
  CameraController,
  UpdateFlags,
  SectionOutlines,
  SectionToolEvent,
  SectionTool
} from '@speckle/viewer'
import type {
  PropertyInfo,
  StringPropertyInfo,
  SunLightConfiguration
} from '@speckle/viewer'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import type {
  Comment,
  Project,
  ProjectCommentThreadsArgs,
  ViewerResourceItem
} from '~~/lib/common/generated/gql/graphql'
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
  useViewerCameraTracker,
  useViewerEventListener
} from '~~/lib/viewer/composables/viewer'
import { useViewerCommentUpdateTracking } from '~~/lib/viewer/composables/commentManagement'
import {
  getCacheId,
  getObjectReference,
  isReference,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import type { ModifyFnCacheData } from '~~/lib/common/helpers/graphql'
import {
  useViewerOpenedThreadUpdateEmitter,
  useViewerThreadTracking
} from '~~/lib/viewer/composables/commentBubbles'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { arraysEqual, isNonNullable } from '~~/lib/common/helpers/utils'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { Vector3 } from 'three'
import { areVectorsLooselyEqual } from '~~/lib/viewer/helpers/three'
import { SafeLocalStorage, type Nullable } from '@speckle/shared'
import {
  useCameraUtilities,
  useMeasurementUtilities
} from '~~/lib/viewer/composables/ui'
import { onKeyStroke, watchTriggerable } from '@vueuse/core'
import { setupDebugMode } from '~~/lib/viewer/composables/setup/dev'
import type { Reference } from '@apollo/client'
import type { Modifier } from '@apollo/client/cache'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useMixpanel } from '~~/lib/core/composables/mp'

function useViewerIsBusyEventHandler() {
  const state = useInjectedViewerState()

  const callback = (isBusy: boolean) => {
    state.ui.viewerBusy.value = isBusy
  }
  onMounted(() => {
    state.viewer.instance.on(ViewerEvent.Busy, callback)
  })

  onBeforeUnmount(() => {
    state.viewer.instance.removeListener(ViewerEvent.Busy, callback)
  })
}

/**
 * Automatically loads & unloads objects into the viewer depending on the global URL resource identifier state
 */
function useViewerObjectAutoLoading() {
  if (import.meta.server) return

  const disableViewerCache =
    SafeLocalStorage.get('FE2_FORCE_DISABLE_VIEWER_CACHE') === 'true'
  const authToken = useAuthCookie()
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
    urlHashState: { focusedThreadId }
  } = useInjectedViewerState()

  const loadObject = (
    objectId: string,
    unload?: boolean,
    options?: Partial<{ zoomToObject: boolean }>
  ) => {
    const objectUrl = getObjectUrl(projectId.value, objectId)
    if (unload) {
      viewer.unloadObject(objectUrl)
    } else {
      viewer.loadObjectAsync(
        objectUrl,
        authToken.value || undefined,
        disableViewerCache ? false : undefined,
        options?.zoomToObject
      )
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

        const res = await Promise.all(
          allObjectIds.map((i) => loadObject(i, false, { zoomToObject }))
        )
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
      const model = event.comment

      if (isArchived) {
        // Mark as archived
        cache.modify({
          id: getCacheId('Comment', event.id),
          fields: {
            archived: () => true
          }
        })

        // Remove from project.commentThreads
        modifyObjectFields<ProjectCommentThreadsArgs, Project['commentThreads']>(
          cache,
          getCacheId('Project', projectId.value),
          (fieldName, variables, data) => {
            if (fieldName !== 'commentThreads') return
            if (variables.filter?.includeArchived) return

            const newItems = (data.items || []).filter(
              (i) => i.__ref !== getObjectReference('Comment', event.id).__ref
            )
            return {
              ...data,
              ...(data.items ? { items: newItems } : {}),
              ...(data.totalCount ? { totalCount: data.totalCount - 1 } : {})
            }
          }
        )
      } else if (isNew && model) {
        const parentId = model.parent?.id

        // Add reply to parent
        if (parentId) {
          cache.modify({
            id: getCacheId('Comment', parentId),
            fields: {
              replies: ((
                oldValue: ModifyFnCacheData<Comment['replies']> | Reference
              ) => {
                if (isReference(oldValue)) return oldValue

                const newValue: typeof oldValue = {
                  totalCount: (oldValue?.totalCount || 0) + 1,
                  items: [
                    getObjectReference('Comment', model.id),
                    ...(oldValue?.items || [])
                  ]
                }
                return newValue
              }) as Modifier<ModifyFnCacheData<Comment['replies']> | Reference>
            }
          })
        } else {
          // Add comment thread
          modifyObjectFields<ProjectCommentThreadsArgs, Project['commentThreads']>(
            cache,
            getCacheId('Project', projectId.value),
            (fieldName, _variables, data) => {
              if (fieldName !== 'commentThreads') return

              const newItems = [
                getObjectReference('Comment', model.id),
                ...(data.items || [])
              ]
              return {
                ...data,
                ...(data.items ? { items: newItems } : {}),
                ...(data.totalCount ? { totalCount: data.totalCount + 1 } : {})
              }
            }
          )
        }
      }
    }
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
      if (newVal && oldVal && newVal.equals(oldVal)) return
      if (!newVal && !oldVal) return

      if (oldVal && !newVal) {
        visible.value = false
        edited.value = false

        instance.sectionBoxOff()
        instance.requestRender(UpdateFlags.RENDER_RESET)
        return
      }

      if (newVal && (!oldVal || !newVal.equals(oldVal))) {
        visible.value = true
        edited.value = false

        instance.setSectionBox({
          min: newVal.min,
          max: newVal.max
        })
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
    }
    // { debounceWait: 100 }
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
  const {
    viewer: { instance },
    ui: { filters, highlightedObjectIds }
  } = useInjectedViewerState()

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

      instance.highlightObjects(newVal)
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
          instance.isolateObjects(isolatable, stateKey, true)
          filters.hiddenObjectIds.value = []
        })
      }

      if (unisolatable.length) {
        withWatchersDisabled(() => {
          instance.unIsolateObjects(unisolatable, stateKey, true)
          filters.hiddenObjectIds.value = []
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
          instance.hideObjects(hidable, stateKey, true)
          filters.isolatedObjectIds.value = []
        })
      }
      if (showable.length) {
        withWatchersDisabled(() => {
          instance.showObjects(showable, stateKey, true)
          filters.isolatedObjectIds.value = []
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

    if (isApplied && targetFilter) await instance.setColorFilter(targetFilter)
    if (!isApplied) await instance.removeColorFilter()
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

      if (!newVal.length) {
        instance.resetSelection()
        return
      }

      instance.selectObjects(newIds)
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
  const authCookie = useAuthCookie()
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
        authCookie.value
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
        instance.enableMeasurements(newVal)
      }
    },
    { immediate: true }
  )

  watch(
    () => ({ ...measurement.options.value }),
    (newMeasurementState) => {
      if (newMeasurementState) {
        instance.setMeasurementOptions(newMeasurementState)
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
      newNoScrollValue
      viewer
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
  useViewerIsBusyEventHandler()
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
