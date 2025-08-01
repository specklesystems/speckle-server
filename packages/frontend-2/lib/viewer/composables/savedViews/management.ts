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
          name
          description
          groupId
          author {
            id
          }
          createdAt
          updatedAt
          projectId
          resourceIdString
          resourceIds
          isHomeView
          visibility
          viewerState
          screenshot
          position
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
          // TODO:
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
