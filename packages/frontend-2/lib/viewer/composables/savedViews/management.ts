import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { CreateSavedViewInput } from '~/lib/common/generated/gql/graphql'
import { useStateSerialization } from '~/lib/viewer/composables/serialization'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

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

          // Project.savedViewGroups + 1, if it is a new group
          modifyObjectField(
            cache,
            getCacheId('Project', projectId.value),
            'savedViewGroups',
            ({ helpers: { createUpdatedValue, ref, readField }, value }) => {
              const isNewGroup = !value?.items?.some(
                (group) => readField(group, 'id') === groupId
              )
              if (!isNewGroup) return

              return createUpdatedValue(({ update }) => {
                update('totalCount', (count) => count + 1)
                update('items', (items) => [...items, ref('SavedViewGroup', groupId)])
              })
            },
            { autoEvictFiltered: true }
          )

          // SavedViewGroup.views + 1
          modifyObjectField(
            cache,
            getCacheId('SavedViewGroup', groupId),
            'views',
            ({ helpers: { createUpdatedValue, ref } }) => {
              return createUpdatedValue(({ update }) => {
                update('totalCount', (count) => count + 1)
                update('items', (items) => [ref('SavedView', viewId), ...items])
              })
            },
            { autoEvictFiltered: true }
          )
        }
      }
    ).catch(convertThrowIntoFetchResult)

    const res = result?.data?.projectMutations.savedViewMutations.createView
    if (res?.id) {
      triggerNotification({
        title: 'Saved View Created',
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
