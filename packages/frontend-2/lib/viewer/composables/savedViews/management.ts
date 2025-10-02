import { useMutation, type MutateResult } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import {
  SortDirection,
  type CreateSavedViewGroupInput,
  type CreateSavedViewInput,
  type UpdateSavedViewGroupInput,
  type UpdateSavedViewGroupMutationVariables,
  type UpdateSavedViewInput,
  type UpdateSavedViewMutation,
  type UseDeleteSavedView_SavedViewFragment,
  type UseDeleteSavedViewGroup_SavedViewGroupFragment,
  type UseUpdateSavedView_SavedViewFragment,
  type UseUpdateSavedViewGroup_SavedViewGroupFragment
} from '~/lib/common/generated/gql/graphql'
import { useStateSerialization } from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import {
  filterKeys,
  onGroupViewRemovalCacheUpdates,
  onNewGroupViewCacheUpdates
} from '~/lib/viewer/helpers/savedViews/cache'
import { isUngroupedGroup } from '@speckle/shared/saved-views'
import {
  getCachedObjectKeys,
  type CacheObjectReference
} from '~/lib/common/helpers/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'

const createSavedViewMutation = graphql(`
  mutation CreateSavedView($input: CreateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        createView(input: $input) {
          id
          groupId
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
  const {
    projectId,
    resources: {
      response: { project }
    }
  } = useInjectedViewerState()
  const { triggerNotification } = useGlobalToast()
  const { collect } = useCollectNewSavedViewViewerData()
  const mp = useMixpanel()

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

    if (res?.id) {
      mp.track('Saved View Created', {
        viewId: res.id,
        groupId: res.groupId,
        // eslint-disable-next-line camelcase
        workspace_id: project.value?.workspaceId
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
          ...UseViewerSavedViewSetup_SavedView
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
    isHomeView
    groupResourceIds
    group {
      id
    }
  }
`)

export const useUpdateSavedView = () => {
  const { mutate } = useMutation(updateSavedViewMutation)
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()
  const mp = useMixpanel()
  const {
    resources: {
      response: { project }
    }
  } = useInjectedViewerState()

  return async (
    params: {
      view: UseUpdateSavedView_SavedViewFragment
      input: UpdateSavedViewInput
    },
    options?: Partial<{
      /**
       * Whether to skip toast notifications
       */
      skipToast: boolean
      /**
       * To get the full response, use this callback
       */
      onFullResult?: (
        res: Awaited<MutateResult<UpdateSavedViewMutation>>,
        success: boolean
      ) => void
    }>
  ) => {
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

          // W/ current filter setup, if u can change visibility, you're gonna see it in all filtered groups
          // const newVisibility = update.visibility
          // const visibilityChanged = oldVisibility !== newVisibility
          // if (visibilityChanged) {
          //   // Update all SavedViewGroup.views to see if it now should appear in there or not
          //   modifyObjectField(
          //     cache,
          //     getCacheId('SavedViewGroup', newGroupId),
          //     'views',
          //     ({ helpers: { evict } }) => evict()
          //   )
          // }

          // If set to home view, clear home view on all other views related to the same resourceIdString
          if (update.isHomeView && update.groupResourceIds.length === 1) {
            const allSavedViewKeys = getCachedObjectKeys(cache, 'SavedView')
            const modelId = update.groupResourceIds[0]

            for (const savedViewKey of allSavedViewKeys) {
              modifyObjectField(
                cache,
                savedViewKey,
                'isHomeView',
                ({ value: isHomeView, helpers: { readObject } }) => {
                  const view = readObject()
                  const groupIds = view.groupResourceIds
                  const viewId = view.id
                  const projectId = view.projectId
                  if (viewId === update.id) return
                  if (update.projectId !== projectId) return

                  if (isHomeView && groupIds?.length === 1 && groupIds[0] === modelId) {
                    return false
                  }
                }
              )
            }
          }

          // If position changed, re-sort the group
          if (input.position) {
            modifyObjectField(
              cache,
              getCacheId('SavedViewGroup', newGroupId),
              'views',
              ({ helpers: { createUpdatedValue, readField }, variables }) => {
                const sortDir = variables.input.sortDirection || SortDirection.Desc
                const sortBy = (variables.input.sortBy || 'position') as
                  | 'position'
                  | 'updatedAt'

                return createUpdatedValue(({ update }) => {
                  update('items', (items) => {
                    return items.slice().sort((a, b) => {
                      const process = (ref: CacheObjectReference<'SavedView'>) => {
                        const val = readField(ref, sortBy)
                        if (!val) return -1

                        if (sortBy === 'updatedAt') {
                          return new Date(val).getTime()
                        }
                        return val as number
                      }

                      const aVal = process(a)
                      const bVal = process(b)

                      if (aVal < bVal) return sortDir === SortDirection.Asc ? -1 : 1
                      if (aVal > bVal) return sortDir === SortDirection.Asc ? 1 : -1
                      return 0
                    })
                  })
                })
              }
            )
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.updateView
    if (!options?.skipToast) {
      if (res?.id) {
        triggerNotification({
          title: 'View updated',
          type: ToastNotificationType.Success
        })
      } else {
        const err = getFirstGqlErrorMessage(result?.errors)
        triggerNotification({
          title: "Couldn't update view",
          description: err,
          type: ToastNotificationType.Danger
        })
      }
    }

    if (res?.id) {
      if ('isHomeView' in input) {
        mp.track('Saved View Set as Home View', {
          viewId: res.id,
          isHomeView: input.isHomeView,
          // eslint-disable-next-line camelcase
          workspace_id: project.value?.workspaceId
        })
      }
    }

    options?.onFullResult?.(result, !!res)
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
  const mp = useMixpanel()
  const {
    resources: {
      response: { project }
    }
  } = useInjectedViewerState()

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
            { autoEvictFiltered: filterKeys }
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

    if (res?.id) {
      mp.track('Saved View Group Created', {
        groupId: res.id,
        // eslint-disable-next-line camelcase
        workspace_id: project.value?.workspaceId
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
    isUngroupedViewsGroup
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
    if (!groupId || group.isUngroupedViewsGroup) return // not real group

    const result = await mutate(
      { input: { groupId, projectId } },
      {
        update: (cache, res) => {
          const deleteSuccessful =
            res.data?.projectMutations.savedViewMutations.deleteGroup
          if (!deleteSuccessful) return

          // Views can be moved around, just easier to evict Project.savedViewGroups
          modifyObjectField(
            cache,
            getCacheId('Project', projectId),
            'savedViewGroups',
            ({ helpers: { evict } }) => evict()
          )
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

const updateSavedViewGroupMutation = graphql(`
  mutation UpdateSavedViewGroup($input: UpdateSavedViewGroupInput!) {
    projectMutations {
      savedViewMutations {
        updateGroup(input: $input) {
          id
          ...UseUpdateSavedViewGroup_SavedViewGroup
        }
      }
    }
  }
`)

graphql(`
  fragment UseUpdateSavedViewGroup_SavedViewGroup on SavedViewGroup {
    id
    projectId
    groupId
    title
    isUngroupedViewsGroup
  }
`)

export const useUpdateSavedViewGroup = () => {
  const { mutate } = useMutation(updateSavedViewGroupMutation)
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (params: {
    group: UseUpdateSavedViewGroup_SavedViewGroupFragment
    update: Omit<UpdateSavedViewGroupInput, 'projectId' | 'groupId'>
  }) => {
    const { group, update } = params
    if (!isLoggedIn.value) return
    if (group.isUngroupedViewsGroup) return

    const result = await mutate(
      {
        input: {
          projectId: group.projectId,
          groupId: group.id,
          ...update
        }
      },
      {
        optimisticResponse(vars) {
          // apollo typing issue:
          const typedVars = vars as UpdateSavedViewGroupMutationVariables

          // We want the name update to be immediate to avoid flashing content
          return {
            projectMutations: {
              savedViewMutations: {
                updateGroup: {
                  ...group,
                  title: typedVars.input.name || group.title
                }
              }
            }
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.updateGroup
    if (res?.id) {
      triggerNotification({
        title: 'Group updated',
        type: ToastNotificationType.Success
      })
    } else {
      const err = getFirstGqlErrorMessage(result?.errors)
      triggerNotification({
        title: "Couldn't update group",
        description: err,
        type: ToastNotificationType.Danger
      })
    }

    return res
  }
}
