import { useMutation } from '@vue/apollo-composable'
import {
  approveWorkspaceJoinRequestMutation,
  denyWorkspaceJoinRequestMutation
} from '~/lib/workspaces/graphql/mutations'
import {
  type ApproveWorkspaceJoinRequestInput,
  type DenyWorkspaceJoinRequestInput,
  WorkspaceJoinRequestStatus
} from '~~/lib/common/generated/gql/graphql'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  modifyObjectField,
  getCacheId
} from '~~/lib/common/helpers/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'

export const useWorkspaceJoinRequest = () => {
  const { mutate: approveMutation } = useMutation(approveWorkspaceJoinRequestMutation)
  const { mutate: denyMutation } = useMutation(denyWorkspaceJoinRequestMutation)
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  const approve = async (
    input: ApproveWorkspaceJoinRequestInput,
    requestId: string
  ) => {
    const result = await approveMutation(
      { input },
      {
        update: (cache) => {
          modifyObjectField(
            cache,
            getCacheId('WorkspaceJoinRequest', requestId),
            'status',
            () => WorkspaceJoinRequestStatus.Approved
          )
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace join request approved'
      })

      mixpanel.track('Workspace Join Request Approved', {
        // eslint-disable-next-line camelcase
        workspace_id: input.workspaceId
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

  const deny = async (input: DenyWorkspaceJoinRequestInput, requestId: string) => {
    const result = await denyMutation(
      { input },
      {
        update: (cache) => {
          modifyObjectField(
            cache,
            getCacheId('WorkspaceJoinRequest', requestId),
            'status',
            () => WorkspaceJoinRequestStatus.Denied
          )
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace join request denied'
      })

      mixpanel.track('Workspace Join Request Denied', {
        // eslint-disable-next-line camelcase
        workspace_id: input.workspaceId
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
