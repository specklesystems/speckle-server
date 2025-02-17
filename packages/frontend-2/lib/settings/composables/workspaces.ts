import { useMutation } from '@vue/apollo-composable'
import type {
  SettingsCancelWorkspaceInviteMutationVariables,
  SettingsResendWorkspaceInviteMutationVariables
} from '~/lib/common/generated/gql/graphql'
import { getCacheId } from '~/lib/common/helpers/graphql'
import {
  settingsCancelWorkspaceInviteMutation,
  settingsResendWorkspaceInviteMutation
} from '~/lib/settings/graphql/mutations'

export const useCancelWorkspaceInvite = () => {
  const { mutate: cancelInvite } = useMutation(settingsCancelWorkspaceInviteMutation)
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (args: SettingsCancelWorkspaceInviteMutationVariables) => {
    if (!activeUser.value) {
      return false
    }

    const res = await cancelInvite(args, {
      update: (cache, { data }) => {
        if (!data?.workspaceMutations.invites.cancel.id) {
          return
        }

        // Evict invite from cache
        cache.evict({
          id: getCacheId('PendingWorkspaceCollaborator', `invite:${args.inviteId}`)
        })
      }
    }).catch(convertThrowIntoFetchResult)
    if (res?.data?.workspaceMutations.invites.cancel.id) {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Invite deleted'
      })
    } else {
      const errMsg = getFirstGqlErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error deleting invite',
        description: errMsg
      })
    }

    return res?.data?.workspaceMutations.invites.cancel.id
  }
}

export const useResendWorkspaceInvite = () => {
  const { mutate: resendInvite } = useMutation(settingsResendWorkspaceInviteMutation)
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (args: SettingsResendWorkspaceInviteMutationVariables) => {
    if (!activeUser.value) {
      return false
    }

    const res = await resendInvite(args).catch(convertThrowIntoFetchResult)
    if (res?.data?.workspaceMutations.invites.resend) {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Invite e-mail re-sent!'
      })
    } else {
      const errMsg = getFirstGqlErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error re-sending invite e-mail!',
        description: errMsg
      })
    }

    return res?.data?.workspaceMutations.invites.resend
  }
}
