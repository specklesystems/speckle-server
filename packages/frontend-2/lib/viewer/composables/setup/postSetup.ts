import { difference, uniq, merge } from 'lodash-es'
import { ViewerEvent } from '@speckle/viewer'
import { useAuthCookie } from '~~/lib/auth/composables/auth'
import {
  Comment,
  Project,
  ProjectCommentsUpdatedMessageType,
  ProjectCommentThreadsArgs,
  ProjectModelsUpdatedMessageType,
  ProjectUpdatedMessageType,
  ProjectVersionsUpdatedMessageType,
  ProjectViewerResourcesQuery,
  ViewerLoadedResourcesQuery,
  ViewerResourceItem
} from '~~/lib/common/generated/gql/graphql'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useViewerSelectionEventHandler } from '~~/lib/viewer/composables/setup/selection'
import { useGetObjectUrl } from '~~/lib/viewer/composables/viewer'
import { useApolloClient } from '@vue/apollo-composable'
import { useViewerCommentUpdateTracking } from '~~/lib/viewer/composables/commentManagement'
import {
  getCacheId,
  getObjectReference,
  ModifyFnCacheData,
  modifyObjectFields,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { useProjectModelUpdateTracking } from '~~/lib/projects/composables/modelManagement'
import {
  projectViewerResourcesQuery,
  viewerLoadedResourcesQuery
} from '~~/lib/viewer/graphql/queries'
import { SpeckleViewer } from '@speckle/shared'
import {
  useProjectPendingVersionUpdateTracking,
  useProjectVersionUpdateTracking
} from '~~/lib/projects/composables/versionManagement'
import { PartialDeep } from 'type-fest'
import {
  useViewerOpenedThreadUpdateEmitter,
  useViewerThreadTracking
} from '~~/lib/viewer/composables/commentBubbles'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useNavigateToHome } from '~~/lib/common/helpers/route'

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

  const apollo = useApolloClient().client
  const {
    projectId,
    resources: {
      request: { resourceIdString, threadFilters },
      response: { resourceQueryVariables, resourceItemsQueryVariables }
    }
  } = useInjectedViewerState()
  const { triggerNotification } = useGlobalToast()
  const goHome = useNavigateToHome()

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

  useProjectModelUpdateTracking(projectId, (event) => {
    // If model deleted, delete resource item
    if (event.type === ProjectModelsUpdatedMessageType.Deleted) {
      updateCacheByFilter(
        apollo.cache,
        {
          query: {
            query: projectViewerResourcesQuery,
            variables: resourceItemsQueryVariables.value
          }
        },
        (data) => {
          if (!data.project?.viewerResources) return
          const groupIdx = data.project.viewerResources.findIndex((g) =>
            g.items.find((i) => i.modelId === event.id)
          )
          if (groupIdx === -1) return

          const newGroups = data.project.viewerResources
            .map((g) => {
              const newItems = g.items.filter((i) => i.modelId !== event.id)
              return {
                ...g,
                items: newItems
              }
            })
            .filter((g) => g.items.length > 0)

          return {
            ...data,
            project: {
              ...data.project,
              viewerResources: newGroups
            }
          }
        }
      )
      return
    }

    const model = event.model
    const version = model?.versions.items[0]
    if (!model || !version) return

    // Check if resourceItems need to be updated with this new model
    updateCacheByFilter(
      apollo.cache,
      {
        query: {
          query: projectViewerResourcesQuery,
          variables: resourceItemsQueryVariables.value
        }
      },
      (data) => {
        if (!data.project?.viewerResources) return

        // group is updatable only if it's a folder group, cause then this new
        // model possibly has to go under it. also make sure that the model
        // doesn't already exist there
        const groupIdx = data.project.viewerResources.findIndex((g) => {
          const [res] = SpeckleViewer.ViewerRoute.parseUrlParameters(g.identifier)
          if (
            SpeckleViewer.ViewerRoute.isModelFolderResource(res) &&
            model.name.startsWith(res.folderName) &&
            !g.items.some((i) => i.modelId === model.id)
          )
            return true
          return false
        })
        if (groupIdx === -1) return

        const group = data.project.viewerResources[groupIdx]
        const newItems = [
          ...group.items,
          {
            modelId: model.id,
            versionId: version.id,
            objectId: version.referencedObject
          }
        ]

        const newGroups = data.project.viewerResources.slice()
        newGroups.splice(groupIdx, 1, {
          ...group,
          items: newItems
        })

        return {
          ...data,
          project: {
            ...data.project,
            viewerResources: newGroups
          }
        }
      }
    )
  })

  // Track version updates
  useProjectVersionUpdateTracking(
    projectId,
    (event) => {
      if (event.type !== ProjectVersionsUpdatedMessageType.Created) return
      const version = event.version
      if (!version) return

      const modelId = version.model.id
      const modelName = version.model.name
      const objectId = version.referencedObject

      if (!resourceQueryVariables.value || !resourceItemsQueryVariables.value) return

      // Add new version to Model.versions
      updateCacheByFilter(
        apollo.cache,
        {
          query: {
            query: viewerLoadedResourcesQuery,
            variables: resourceQueryVariables.value
          }
        },
        (data) => {
          if (!data.project?.models.items) return

          const newModels = data.project.models.items.slice()
          const modelIdx = newModels.findIndex((m) => m.id === modelId)
          if (modelIdx === -1) return

          const model = newModels[modelIdx]
          const newVersions = model.versions.items.slice()
          newVersions.unshift(version)

          newModels.splice(modelIdx, 1, {
            ...model,
            versions: {
              ...model.versions,
              items: newVersions,
              totalCount: model.versions.totalCount + 1
            }
          })

          return merge<
            PartialDeep<ViewerLoadedResourcesQuery>,
            ViewerLoadedResourcesQuery,
            PartialDeep<ViewerLoadedResourcesQuery>
          >({}, data, {
            project: { models: { items: newModels } }
          })
        }
      )

      // Update resourceItems w/ new data, potentially changing de-duplication results
      updateCacheByFilter(
        apollo.cache,
        {
          query: {
            query: projectViewerResourcesQuery,
            variables: resourceItemsQueryVariables.value
          }
        },
        (data) => {
          if (!data.project?.viewerResources) return

          // group is updatable only if references a model w/o a specific version id
          // in which case we're gonna replace it with the latest one
          // or maybe its a folder group
          const groupIdx = data.project.viewerResources.findIndex((g) => {
            const [res] = SpeckleViewer.ViewerRoute.parseUrlParameters(g.identifier)
            if (
              SpeckleViewer.ViewerRoute.isModelResource(res) &&
              !res.versionId &&
              g.items.find((i) => i.modelId === modelId)
            )
              return true
            if (
              SpeckleViewer.ViewerRoute.isModelFolderResource(res) &&
              (g.items.find((i) => i.modelId === modelId) ||
                modelName.startsWith(res.folderName))
            )
              return true
            return false
          })
          if (groupIdx === -1) return

          const group = data.project.viewerResources[groupIdx]
          const groupItemIdx = group.items.findIndex((i) => i.modelId === modelId)

          const newGroupItem =
            groupItemIdx !== -1
              ? { ...group.items[groupItemIdx], objectId, versionId: version.id }
              : {
                  versionId: version.id,
                  objectId,
                  modelId
                }

          const newGroupItems = group.items.slice()
          if (groupItemIdx !== -1) {
            newGroupItems.splice(groupItemIdx, 1, newGroupItem)
          } else {
            newGroupItems.push(newGroupItem)
          }

          const newGroup = { ...group, items: newGroupItems }
          const newGroups = data.project.viewerResources.slice()
          newGroups.splice(groupIdx, 1, newGroup)

          return merge<
            PartialDeep<ProjectViewerResourcesQuery>,
            ProjectViewerResourcesQuery,
            PartialDeep<ProjectViewerResourcesQuery>
          >({}, data, { project: { viewerResources: newGroups } })
        }
      )
    },
    { silenceToast: true }
  )

  // Track pending version updates (file imports)
  useProjectPendingVersionUpdateTracking(projectId.value)

  // Redirect to home if project deleted
  useProjectUpdateTracking(projectId, (event) => {
    const isDeleted = event.type === ProjectUpdatedMessageType.Deleted

    if (isDeleted) {
      goHome()

      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Project deleted',
        description: 'Redirecting to home'
      })
    }
  })
}

export function useViewerPostSetup() {
  useViewerObjectAutoLoading()
  useViewerSelectionEventHandler()
  useViewerIsBusyEventHandler()
  useViewerSubscriptionEventTracker()
  useViewerThreadTracking()
  useViewerOpenedThreadUpdateEmitter()
}
