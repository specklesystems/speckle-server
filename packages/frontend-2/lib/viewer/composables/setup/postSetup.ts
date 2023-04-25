// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { difference, flatten, isEqual, uniq } from 'lodash-es'
import { SunLightConfiguration, ViewerEvent } from '@speckle/viewer'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import {
  Comment,
  Project,
  ProjectCommentsUpdatedMessageType,
  ProjectCommentThreadsArgs,
  ViewerResourceItem
} from '~~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useViewerSelectionEventHandler } from '~~/lib/viewer/composables/setup/selection'
import {
  useGetObjectUrl,
  useViewerCameraTracker,
  useViewerEventListener
} from '~~/lib/viewer/composables/viewer'
import { useViewerCommentUpdateTracking } from '~~/lib/viewer/composables/commentManagement'
import {
  getCacheId,
  getObjectReference,
  ModifyFnCacheData,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import {
  useViewerOpenedThreadUpdateEmitter,
  useViewerThreadTracking
} from '~~/lib/viewer/composables/commentBubbles'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { arraysEqual, isNonNullable } from '~~/lib/common/helpers/utils'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { PerspectiveCamera, Vector3 } from 'three'
import { areVectorsLooselyEqual } from '~~/lib/viewer/helpers/three'

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
  if (process.server) return

  const authToken = useAuthCookie()
  const getObjectUrl = useGetObjectUrl()
  const {
    projectId,
    viewer: {
      instance: viewer,
      init: { ref: isInitialized }
    },
    resources: {
      response: { resourceItems }
    }
  } = useInjectedViewerState()

  const loadObject = (objectId: string, unload?: boolean) => {
    const objectUrl = getObjectUrl(projectId.value, objectId)
    if (unload) {
      viewer.unloadObject(objectUrl)
    } else {
      viewer.loadObjectAsync(objectUrl, authToken.value || undefined)
    }
  }

  const getUniqueObjectIds = (resourceItems: ViewerResourceItem[]) =>
    uniq(resourceItems.map((i) => i.objectId))

  watch(
    () => <const>[resourceItems.value, isInitialized.value],
    async ([newResources, newIsInitialized], oldData) => {
      // Wait till viewer loaded in
      if (!newIsInitialized) return

      const [oldResources, oldIsInitialized] = oldData || [[], false]

      // Viewer initialized - load in all resources
      if (newIsInitialized && !oldIsInitialized) {
        const allObjectIds = getUniqueObjectIds(newResources)
        await Promise.all(allObjectIds.map((i) => loadObject(i)))
        return
      }

      // Resources changed?
      const newObjectIds = getUniqueObjectIds(newResources)
      const oldObjectIds = getUniqueObjectIds(oldResources)
      const removableObjectIds = difference(oldObjectIds, newObjectIds)
      const addableObjectIds = difference(newObjectIds, oldObjectIds)

      await Promise.all(removableObjectIds.map((i) => loadObject(i, true)))
      await Promise.all(addableObjectIds.map((i) => loadObject(i)))
    },
    { deep: true, immediate: true }
  )

  onBeforeUnmount(async () => {
    await viewer.unloadAll()
  })
}

/**
 * Listening to model/version updates through subscriptions and making various
 * cache updates so that we don't need to always refetch queries
 */
function useViewerSubscriptionEventTracker() {
  if (process.server) return

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
              replies: (oldValue: ModifyFnCacheData<Comment['replies']>) => {
                const newValue: typeof oldValue = {
                  totalCount: (oldValue?.totalCount || 0) + 1,
                  items: [
                    getObjectReference('Comment', model.id),
                    ...(oldValue?.items || [])
                  ]
                }
                return newValue
              }
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

/**
 * TODO: TWO WAY BINDING
 * - Weird camera zooming/positioning issue
 *  - Zooms out slowly on load
 *  - When client side routing to another model, the position/orientation/zoom seems off
 * - Need to get rid of all direct viewer instance usages
 *  - so that we only interact with state abstraction
 *  - and possibly don't even need current FilteringState
 */

export function useViewerSectionBoxIntegration() {
  const {
    ui: { sectionBox },
    viewer: { instance }
  } = useInjectedViewerState()

  // No two-way sync for section boxes, because once you set a Box3 into the viewer
  // the viewer transforms it into something else causing the updates going into an infinite loop

  // state -> viewer
  watch(
    sectionBox,
    (newVal, oldVal) => {
      if (newVal && oldVal && newVal.equals(oldVal)) return
      if (!newVal && !oldVal) return

      if (oldVal && !newVal) {
        instance.sectionBoxOff()
        instance.requestRender()
        return
      }

      if (newVal && (!oldVal || !newVal.equals(oldVal))) {
        instance.setSectionBox({
          min: newVal.min,
          max: newVal.max
        })
        instance.sectionBoxOn()
        instance.requestRender()
      }
    },
    { immediate: true, deep: true, flush: 'sync' }
  )
}

export function useViewerCameraIntegration() {
  const {
    viewer: { instance },
    ui: {
      camera: { isPerspectiveProjection, position, target }
    }
  } = useInjectedViewerState()

  // viewer -> state
  // debouncing pos/target updates to avoid jitteriness
  useViewerCameraTracker(
    () => {
      const activeCam = instance.cameraHandler.activeCam
      const controls = activeCam.controls
      const viewerPos = new Vector3()
      const viewerTarget = new Vector3()

      controls.getPosition(viewerPos)
      controls.getTarget(viewerTarget)

      if (!areVectorsLooselyEqual(position.value, viewerPos)) {
        position.value = viewerPos.clone()
      }
      if (!areVectorsLooselyEqual(target.value, viewerTarget)) {
        target.value = viewerTarget.clone()
      }
    },
    { debounceWait: 100 }
  )

  useViewerCameraTracker(
    () => {
      const activeCam = instance.cameraHandler.activeCam
      const isPerspective = activeCam.camera instanceof PerspectiveCamera

      if (isPerspectiveProjection.value !== isPerspective) {
        isPerspectiveProjection.value = isPerspective
      }
    },
    { throttleWait: 500 }
  )

  // state -> viewer
  watch(isPerspectiveProjection, (newVal, oldVal) => {
    if (!!newVal === !!oldVal) return

    if (newVal) {
      instance.setPerspectiveCameraOn()
    } else {
      instance.setOrthoCameraOn()
    }
  })

  watch(position, (newVal, oldVal) => {
    if ((!newVal && !oldVal) || (oldVal && areVectorsLooselyEqual(newVal, oldVal))) {
      return
    }

    instance.setView({
      position: newVal,
      target: target.value
    })
  })

  watch(target, (newVal, oldVal) => {
    if ((!newVal && !oldVal) || (oldVal && areVectorsLooselyEqual(newVal, oldVal))) {
      return
    }

    instance.setView({
      position: position.value,
      target: newVal
    })
  })
}

export function useViewerFiltersIntegration() {
  const {
    viewer: {
      instance
      // metadata: { availableFilters }
    },
    ui: { filters, highlightedObjectIds }
  } = useInjectedViewerState()

  const stateKey = 'default'

  // // viewer -> state
  // useViewerEventListener(ViewerEvent.FilteringStateSet, (state: FilteringState) => {
  //   const dbg = JSON.stringify({
  //     viewerIsolated: state.isolatedObjects,
  //     isolated: filters.isolatedObjectIds.value,
  //     viewerHidden: state.hiddenObjects,
  //     hidden: filters.hiddenObjectIds,
  //     viewerFilterKey: state.activePropFilterKey,
  //     currentFilterKey: filters.propertyFilter.filter.value?.key
  //   })
  //   let updatesMade = false

  //   const viewerIsolated = state.isolatedObjects || []
  //   const isolated = filters.isolatedObjectIds.value
  //   if (!arraysEqual(viewerIsolated, isolated)) {
  //     filters.isolatedObjectIds.value = viewerIsolated.slice()
  //     updatesMade = true
  //   }

  //   const viewerHidden = state.hiddenObjects || []
  //   const hidden = filters.hiddenObjectIds.value
  //   if (!arraysEqual(viewerHidden, hidden)) {
  //     filters.hiddenObjectIds.value = viewerHidden.slice()
  //     updatesMade = true
  //   }

  //   const viewerFilterKey = state.activePropFilterKey
  //   const currentFilterKey = filters.propertyFilter.filter.value?.key
  //   if (viewerFilterKey !== currentFilterKey) {
  //     const property = (availableFilters.value || []).find(
  //       (f) => f.key === viewerFilterKey
  //     )
  //     if (property) {
  //       filters.propertyFilter.filter.value = property
  //       updatesMade = true
  //     }
  //   }

  //   if (updatesMade) {
  //     console.log('FILTER UPD', dbg)
  //   }
  // })

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
      if (arraysEqual(newVal, oldVal || [])) return

      const isolatable = newVal
      const unisolatable = difference(oldVal || [], newVal)

      if (isolatable.length) {
        instance.isolateObjects(isolatable, stateKey, true)
      }
      if (unisolatable.length) {
        instance.unIsolateObjects(unisolatable, stateKey, true)
      }
    },
    { immediate: true, flush: 'sync' }
  )

  watch(
    filters.hiddenObjectIds,
    (newVal, oldVal) => {
      if (arraysEqual(newVal, oldVal || [])) return

      const hidable = newVal
      const showable = difference(oldVal || [], newVal)

      if (hidable.length) {
        instance.hideObjects(hidable, stateKey, true)
      }
      if (showable.length) {
        instance.showObjects(showable, stateKey, true)
      }
    },
    { immediate: true, flush: 'sync' }
  )

  watch(
    () =>
      <const>[
        filters.propertyFilter.filter.value,
        filters.propertyFilter.isApplied.value
      ],
    (newVal, oldVal) => {
      const [filter, isApplied] = newVal
      const [oldFilter, oldIsApplied] = oldVal || [null, false]

      if (isEqual(filter, oldFilter) && isEqual(isApplied, oldIsApplied)) return

      if (filter && isApplied) {
        instance.setColorFilter(filter)
      } else {
        instance.removeColorFilter()
      }
    },
    { immediate: true, flush: 'sync' }
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

export function useLightConfigIntegration() {
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
}

export function useViewerPostSetup() {
  if (process.server) return
  useViewerObjectAutoLoading()
  useViewerSelectionEventHandler()
  useViewerIsBusyEventHandler()
  useViewerSubscriptionEventTracker()
  useViewerThreadTracking()
  useViewerOpenedThreadUpdateEmitter()
  useViewerSectionBoxIntegration()
  useViewerCameraIntegration()
  useViewerFiltersIntegration()
  useLightConfigIntegration()
}
