import { useMutation, type MutateResult } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  CreateSavedViewGroupInput,
  CreateSavedViewInput,
  UpdateSavedViewGroupInput,
  UpdateSavedViewGroupMutationVariables,
  UpdateSavedViewInput,
  UpdateSavedViewMutation,
  UseDeleteSavedView_SavedViewFragment,
  UseDeleteSavedViewGroup_SavedViewGroupFragment,
  UseUpdateSavedView_SavedViewFragment,
  UseUpdateSavedViewGroup_SavedViewGroupFragment
} from '~/lib/common/generated/gql/graphql'
import { useStateSerialization } from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useMixpanel } from '~/lib/core/composables/mp'

const createSavedViewMutation = graphql(`
  mutation CreateSavedView($input: CreateSavedViewInput!) {
    projectMutations {
      savedViewMutations {
        createView(input: $input) {
          id
          resourceIds
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
    viewer: { instance: viewerInstance },
    resources: {
      response: { concreteResourceIdString }
    }
  } = useInjectedViewerState()
  const { serialize } = useStateSerialization()

  const collect = async (): Promise<
    Pick<
      CreateSavedViewInput,
      'resourceIdString' | 'viewerState' | 'screenshot' | 'projectId'
    >
  > => {
    const screenshot = await viewerInstance.screenshot()
    return {
      projectId: projectId.value,
      resourceIdString: concreteResourceIdString.value,
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

    const result = await mutate({
      input: {
        ...input,
        ...(await collect())
      }
    }).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.createView
    if (!res?.id) {
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
    resourceIds
    group {
      id
      groupId
      resourceIds
    }
  }
`)

export const useDeleteSavedView = () => {
  const { mutate } = useMutation(deleteSavedViewMutation)
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (params: { view: UseDeleteSavedView_SavedViewFragment }) => {
    const { id, projectId } = params.view
    if (!id || !projectId || !isLoggedIn.value) {
      return
    }

    const result = await mutate({
      input: {
        projectId,
        id
      }
    }).catch(convertThrowIntoFetchResult)

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
          ...UseUpdateSavedView_SavedView
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
    resourceIds
    group {
      id
      groupId
      resourceIds
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
    const result = await mutate({ input }).catch(convertThrowIntoFetchResult)

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

    const ret = await mutate({ input }).catch(convertThrowIntoFetchResult)
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

    const result = await mutate({ input: { groupId, projectId } }).catch(
      convertThrowIntoFetchResult
    )

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
