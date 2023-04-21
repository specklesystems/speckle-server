// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { difference, flatten, isEqual, uniq } from 'lodash-es'
import { FilteringState, SunLightConfiguration, ViewerEvent } from '@speckle/viewer'
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
 * - There are def some issues there
 * - Need to get rid of all direct viewer instance usages
 *  - so that we only interact with state abstraction
 *  - and possibly don't even need current FilteringState
 * - Light configuration in the state
 */

export function useViewerSectionBoxIntegration() {
  const {
    ui: { sectionBox },
    viewer: { instance }
  } = useInjectedViewerState()

  // // viewer -> state
  // useViewerEventListener(
  //   [ViewerEvent.SectionBoxChanged, ViewerEvent.SectionBoxUpdated],
  //   () => {
  //     const viewerSectionBox = instance.sectionBox.getCurrentBox()
  //     if (
  //       viewerSectionBox &&
  //       sectionBox.value &&
  //       sectionBox.value.equals(viewerSectionBox)
  //     ) {
  //       return
  //     }
  //     if (!viewerSectionBox && !sectionBox.value) return

  //     console.log('SECTION BOX UPD', sectionBox.value, viewerSectionBox)
  //     sectionBox.value = viewerSectionBox ? viewerSectionBox.clone() : null
  //   }
  // )

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

      if (
        newVal &&
        (!oldVal || !newVal.min.equals(oldVal.min) || !newVal.max.equals(oldVal.max))
      ) {
        instance.setSectionBox(newVal.clone())
        instance.sectionBoxOn()
        instance.requestRender()
      }
    },
    { deep: true }
  )
}

export function useViewerCameraIntegration() {
  const {
    viewer: { instance },
    ui: {
      camera: { isPerspectiveProjection, position, target }
    }
  } = useInjectedViewerState()

  // // viewer -> state
  // useViewerCameraTracker(
  //   () => {
  //     const activeCam = instance.cameraHandler.activeCam
  //     const isPerspective = activeCam.camera instanceof PerspectiveCamera

  //     const controls = activeCam.controls
  //     const viewerPos = new Vector3()
  //     const viewerTarget = new Vector3()

  //     controls.getPosition(viewerPos)
  //     controls.getTarget(viewerTarget)

  //     /**
  //      * TODO:
  //      * - Loose vector equality for less updates?
  //      * - perspective update loop on hotreload
  //      */

  //     const dbg = JSON.stringify({
  //       viewerPos,
  //       position: position.value,
  //       viewerTarget,
  //       target: target.value,
  //       isPerspective,
  //       isPerspectiveProjection: isPerspectiveProjection.value
  //     })
  //     let updatesDone = false
  //     if (!viewerPos.equals(position.value)) {
  //       position.value = viewerPos.clone()
  //       updatesDone = true
  //     }
  //     if (!viewerTarget.equals(target.value)) {
  //       target.value = viewerTarget.clone()
  //       updatesDone = true
  //     }
  //     if (isPerspectiveProjection.value !== isPerspective) {
  //       isPerspectiveProjection.value = isPerspective
  //       updatesDone = true
  //     }

  //     if (updatesDone) {
  //       console.log('CAM UPD', JSON.parse(dbg), new Date().toISOString())
  //     }
  //   },
  //   { throttleWait: 500 }
  // )

  // state -> viewer
  watch(isPerspectiveProjection, (newVal, oldVal) => {
    if (!!newVal !== !!oldVal) {
      instance.toggleCameraProjection()
    }
  })

  watch(position, (newVal, oldVal) => {
    if ((!newVal && !oldVal) || (oldVal && newVal.equals(oldVal))) {
      return
    }

    instance.cameraHandler.activeCam.controls.setPosition(newVal.x, newVal.y, newVal.z)
  })

  watch(target, (newVal, oldVal) => {
    if ((!newVal && !oldVal) || (oldVal && newVal.equals(oldVal))) {
      return
    }

    instance.cameraHandler.activeCam.controls.setTarget(newVal.x, newVal.y, newVal.z)
  })
}

export function useViewerFiltersIntegration() {
  const {
    viewer: {
      instance,
      metadata: { availableFilters }
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
  watch(highlightedObjectIds, (newVal, oldVal) => {
    if (arraysEqual(newVal, oldVal || [])) return

    instance.highlightObjects(newVal)
  })

  watch(filters.isolatedObjectIds, (newVal, oldVal) => {
    if (arraysEqual(newVal, oldVal || [])) return

    const isolatable = newVal
    const unisolatable = difference(oldVal || [], newVal)

    if (isolatable.length) {
      instance.isolateObjects(isolatable, stateKey, true)
    }
    if (unisolatable.length) {
      instance.unIsolateObjects(unisolatable, stateKey, true)
    }
  })

  watch(filters.hiddenObjectIds, (newVal, oldVal) => {
    if (arraysEqual(newVal, oldVal || [])) return

    const hidable = newVal
    const showable = difference(oldVal || [], newVal)

    if (hidable.length) {
      instance.hideObjects(hidable, stateKey, true)
    }
    if (showable.length) {
      instance.showObjects(showable, stateKey, true)
    }
  })

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
    }
  )

  watch(filters.selectedObjects, (newVal, oldVal) => {
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
  })
}

function useViewerSunLightIntegration() {
  const {
    viewer: { instance },
    ui: { sunLightConfiguration }
  } = useInjectedViewerState()

  // viewer -> state
  useViewerEventListener(
    ViewerEvent.SunLightConfigurationUpdated,
    (config: SunLightConfiguration) => {
      if (!isEqual(config, sunLightConfiguration.value)) {
        console.log('SUNLI UPD', config, sunLightConfiguration.value)
        sunLightConfiguration.value = config
      }
    }
  )

  // state -> viewer
  watch(
    sunLightConfiguration,
    (newVal, oldVal) => {
      if (isEqual(newVal, oldVal)) return
      instance.setLightConfiguration(newVal)
    },
    { immediate: true }
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
  useViewerSunLightIntegration()
}
