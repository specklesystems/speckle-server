import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  CreateSavedViewGroupInput,
  CreateSavedViewInput,
  UpdateSavedViewInput,
  UseDeleteSavedView_SavedViewFragment,
  UseDeleteSavedViewGroup_SavedViewGroupFragment,
  UseUpdateSavedView_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { useStateSerialization } from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import {
  onGroupViewRemovalCacheUpdates,
  onNewGroupViewCacheUpdates
} from '~/lib/viewer/helpers/savedViews/cache'
import { isUngroupedGroup } from '@speckle/shared/saved-views'
import type { Optional } from '@speckle/shared'
import type { CacheObjectReference } from '~/lib/common/helpers/graphql'

const createSavedViewMutation = graphql(`
  mutation CreateSavedView($input: CreateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        createView(input: $input) {
          id
          ...ViewerSavedViewsPanelView_SavedView
          group {
            id
            ...ViewerSavedViewsPanelViewsGroup_SavedViewGroup
          }
        }
      }
    }
  }
`)

export const useCollectNewSavedViewViewerData = () => {
  const {
    projectId,
    viewer: { instance: viewerInstance }
  } = useInjectedViewerState()
  const { serialize, buildConcreteResourceIdString } = useStateSerialization()

  const collect = async (): Promise<
    Pick<
      CreateSavedViewInput,
      'resourceIdString' | 'viewerState' | 'screenshot' | 'projectId'
    >
  > => {
    const screenshot = await viewerInstance.screenshot()
    return {
      projectId: projectId.value,
      resourceIdString: buildConcreteResourceIdString(),
      viewerState: serialize({ concreteResourceIdString: true }),
      screenshot
    }
  }

  return {
    collect
  }
}

export const useCreateSavedView = () => {
  const { mutate } = useMutation(createSavedViewMutation)
  const { userId } = useActiveUser()
  const { projectId } = useInjectedViewerState()
  const { triggerNotification } = useGlobalToast()
  const { collect } = useCollectNewSavedViewViewerData()

  return async (
    input: Omit<
      CreateSavedViewInput,
      'projectId' | 'resourceIdString' | 'viewerState' | 'screenshot'
    >
  ) => {
    if (!userId.value) return

    const result = await mutate(
      {
        input: {
          ...input,
          ...(await collect())
        }
      },
      {
        update: (cache, { data }) => {
          const res = data?.projectMutations.savedViewMutations.createView
          if (!res) return

          const viewId = res.id
          const groupId = res.group.id

          onNewGroupViewCacheUpdates(cache, {
            viewId,
            groupId,
            projectId: projectId.value
          })
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.createView
    if (res?.id) {
      triggerNotification({
        title: 'Saved view created',
        type: ToastNotificationType.Success
      })
    } else {
      const err = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        title: "Couldn't create saved view",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}

const deleteSavedViewMutation = graphql(`
  mutation DeleteSavedView($input: DeleteSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        deleteView(input: $input)
      }
    }
  }
`)

graphql(`
  fragment UseDeleteSavedView_SavedView on SavedView {
    id
    projectId
    group {
      id
    }
  }
`)

export const useDeleteSavedView = () => {
  const { mutate } = useMutation(deleteSavedViewMutation)
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (params: { view: UseDeleteSavedView_SavedViewFragment }) => {
    const { id, projectId } = params.view
    const groupId = params.view.group.id

    if (!id || !projectId || !isLoggedIn.value) {
      return
    }

    const result = await mutate(
      {
        input: {
          projectId,
          id
        }
      },
      {
        update: (cache, res) => {
          if (!res.data?.projectMutations.savedViewMutations.deleteView) return

          onGroupViewRemovalCacheUpdates(cache, {
            viewId: id,
            groupId,
            projectId
          })

          // Remove the view from the cache
          cache.evict({ id: getCacheId('SavedView', id) })
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.deleteView
    if (res) {
      triggerNotification({
        title: 'View deleted',
        type: ToastNotificationType.Success
      })
    } else {
      const err = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        title: "Couldn't delete saved view",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}

const updateSavedViewMutation = graphql(`
  mutation UpdateSavedView($input: UpdateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        updateView(input: $input) {
          id
          ...ViewerSavedViewsPanelView_SavedView
          group {
            id
            ...ViewerSavedViewsPanelViewsGroup_SavedViewGroup
          }
        }
      }
    }
  }
`)

graphql(`
  fragment UseUpdateSavedView_SavedView on SavedView {
    id
    projectId
    group {
      id
    }
  }
`)

export const useUpdateSavedView = () => {
  const { mutate } = useMutation(updateSavedViewMutation)
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (params: {
    view: UseUpdateSavedView_SavedViewFragment
    input: UpdateSavedViewInput
  }) => {
    if (!isLoggedIn.value) return
    const { input } = params

    const oldGroupId = params.view.group.id

    const result = await mutate(
      { input },
      {
        update: (cache, res) => {
          const update = res.data?.projectMutations.savedViewMutations.updateView
          if (!update) return

          const newGroupId = update.group.id
          const groupChanged = oldGroupId !== newGroupId
          if (groupChanged) {
            // Clean up old group
            onGroupViewRemovalCacheUpdates(cache, {
              viewId: params.view.id,
              groupId: oldGroupId,
              projectId: params.view.projectId
            })

            // Update new group
            onNewGroupViewCacheUpdates(cache, {
              viewId: update.id,
              groupId: newGroupId,
              projectId: params.view.projectId
            })
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.updateView
    if (res?.id) {
      triggerNotification({
        title: 'View updated',
        type: ToastNotificationType.Success
      })
    } else {
      const err = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        title: "Couldn't update saved view",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}

const createSavedViewGroupMutation = graphql(`
  mutation CreateSavedViewGroup($input: CreateSavedViewGroupInput!) {
    projectMutations {
      savedViewMutations {
        createGroup(input: $input) {
          id
          ...ViewerSavedViewsPanelViewsGroup_SavedViewGroup
        }
      }
    }
  }
`)

export const useCreateSavedViewGroup = () => {
  const { mutate } = useMutation(createSavedViewGroupMutation)
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (input: CreateSavedViewGroupInput) => {
    if (!isLoggedIn.value) return

    const ret = await mutate(
      { input },
      {
        update: (cache, res) => {
          const group = res.data?.projectMutations.savedViewMutations.createGroup
          if (!group?.id) return

          // Project.savedViewGroups +1
          modifyObjectField(
            cache,
            getCacheId('Project', input.projectId),
            'savedViewGroups',
            ({ helpers: { createUpdatedValue, fromRef, ref } }) =>
              createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => totalCount + 1)
                update('items', (items) => {
                  const newItems = items.slice()

                  // default comes first, then new group
                  const defaultIdx = newItems.findIndex((i) =>
                    isUngroupedGroup(fromRef(i).id)
                  )

                  newItems.splice(defaultIdx + 1, 0, ref('SavedViewGroup', group.id))

                  return newItems
                })
              }),
            { autoEvictFiltered: true }
          )
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = ret?.data?.projectMutations.savedViewMutations.createGroup
    if (res?.id) {
      triggerNotification({
        title: 'Group created',
        type: ToastNotificationType.Success
      })
    } else {
      const err = getFirstGqlErrorMessage(ret?.errors)
      triggerNotification({
        title: "Couldn't create group",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}

const deleteSavedViewGroupMutation = graphql(`
  mutation DeleteSavedViewGroup($input: DeleteSavedViewGroupInput!) {
    projectMutations {
      savedViewMutations {
        deleteGroup(input: $input)
      }
    }
  }
`)

graphql(`
  fragment UseDeleteSavedViewGroup_SavedViewGroup on SavedViewGroup {
    id
    groupId
    projectId
  }
`)

export const useDeleteSavedViewGroup = () => {
  const { mutate } = useMutation(deleteSavedViewGroupMutation)
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (group: UseDeleteSavedViewGroup_SavedViewGroupFragment) => {
    if (!isLoggedIn.value) return
    const groupId = group.groupId
    const projectId = group.projectId
    if (!groupId) return // not real group

    const result = await mutate(
      { input: { groupId, projectId } },
      {
        update: (cache, res) => {
          const deleteSuccessful =
            res.data?.projectMutations.savedViewMutations.deleteGroup
          if (!deleteSuccessful) return

          // Project.savedViewGroups - 1
          modifyObjectField(
            cache,
            getCacheId('Project', projectId),
            'savedViewGroups',
            ({ helpers: { createUpdatedValue, fromRef } }) =>
              createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => totalCount - 1)
                update('items', (items) => {
                  const newItems = items.filter((i) => fromRef(i).id !== groupId)
                  return newItems
                })
              }),
            { autoEvictFiltered: true }
          )

          // Possibly a bunch of views got moved back to Ungrouped as well
          // Try to find Ungrouped group first
          let ungroupedGroupRef = undefined as Optional<
            CacheObjectReference<'SavedViewGroup'>
          >
          iterateObjectField(
            cache,
            getCacheId('Project', projectId),
            'savedViewGroups',
            ({ value, variables, helpers: { fromRef } }) => {
              if (variables.input.onlyAuthored || variables.input.onlyAuthored) return

              const candidate = value.items?.find((i) =>
                isUngroupedGroup(fromRef(i).id)
              )
              if (candidate) {
                ungroupedGroupRef = candidate
              }
            }
          )

          if (ungroupedGroupRef) {
            // Evict SavedViewGroup.views for ungrouped view
            modifyObjectField(
              cache,
              ungroupedGroupRef.__ref,
              'views',
              ({ helpers: { evict } }) => {
                return evict()
              }
            )
          }

          // Evict
          cache.evict({
            id: getCacheId('SavedViewGroup', groupId)
          })
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.deleteGroup
    if (res) {
      triggerNotification({
        title: 'Group deleted',
        type: ToastNotificationType.Success
      })
    } else {
      const err = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        title: "Couldn't delete group",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}
