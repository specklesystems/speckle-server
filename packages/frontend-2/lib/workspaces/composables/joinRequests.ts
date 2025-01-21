import { useMutation } from '@vue/apollo-composable'
import {
  approveWorkspaceJoinRequestMutation,
  denyWorkspaceJoinRequestMutation
} from '~/lib/workspaces/graphql/mutations'
import type {
  ApproveWorkspaceJoinRequestInput,
  DenyWorkspaceJoinRequestInput
} from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'

export const useWorkspaceJoinRequest = () => {
  const { mutate: approveMutation } = useMutation(approveWorkspaceJoinRequestMutation)
  const { mutate: denyMutation } = useMutation(denyWorkspaceJoinRequestMutation)
  const { triggerNotification } = useGlobalToast()

  const approve = async (input: ApproveWorkspaceJoinRequestInput) => {
    const result = await approveMutation({ input }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace join request approved'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Workspace join request approval failed',
        description: errorMessage
      })
    }
  }

  const deny = async (input: DenyWorkspaceJoinRequestInput) => {
    const result = await denyMutation({ input }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace join request denied'
      })
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Workspace join request denial failed',
        description: errorMessage
      })
    }
  }

  return { approve, deny }
}
