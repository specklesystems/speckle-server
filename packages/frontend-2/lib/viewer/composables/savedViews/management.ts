import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  CreateSavedViewInput,
  UpdateSavedViewInput,
  UseDeleteSavedView_SavedViewFragment,
  UseUpdateSavedView_SavedViewFragment
} from '~/lib/common/generated/gql/graphql'
import { useStateSerialization } from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import {
  onGroupViewRemovalCacheUpdates,
  onNewGroupViewCacheUpdates
} from '~/lib/viewer/helpers/savedViews/cache'

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

export const useCreateSavedView = () => {
  const { mutate } = useMutation(createSavedViewMutation)
  const { userId } = useActiveUser()
  const {
    projectId,
    viewer: { instance: viewerInstance }
  } = useInjectedViewerState()
  const { serialize, buildConcreteResourceIdString } = useStateSerialization()
  const { triggerNotification } = useGlobalToast()

  return async (
    input: Omit<
      CreateSavedViewInput,
      'projectId' | 'resourceIdString' | 'viewerState' | 'screenshot'
    >
  ) => {
    if (!userId.value) return
    const screenshot = await viewerInstance.screenshot()

    const result = await mutate(
      {
        input: {
          ...input,
          projectId: projectId.value,
          resourceIdString: buildConcreteResourceIdString(),
          viewerState: serialize({ concreteResourceIdString: true }),
          screenshot
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
