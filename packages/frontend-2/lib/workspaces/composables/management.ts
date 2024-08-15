import { useMutation } from '@vue/apollo-composable'
import type {
  Workspace,
  WorkspaceInviteCreateInput,
  WorkspaceInvitedTeamArgs,
  WorkspaceInviteUseInput
} from '~/lib/common/generated/gql/graphql'
import {
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage,
  getObjectReference,
  modifyObjectFields
} from '~/lib/common/helpers/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import {
  inviteToWorkspaceMutation,
  processWorkspaceInviteMutation
} from '~/lib/workspaces/graphql/mutations'

export const useInviteUserToWorkspace = () => {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate } = useMutation(inviteToWorkspaceMutation)

  return async (workspaceId: string, inputs: WorkspaceInviteCreateInput[]) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } =
      (await mutate(
        { workspaceId, input: inputs },
        {
          update: (cache, { data }) => {
            if (!data?.workspaceMutations.invites.batchCreate.id) return

            const invitedTeam = data.workspaceMutations.invites.batchCreate.invitedTeam
            if (!invitedTeam) return

            modifyObjectFields<WorkspaceInvitedTeamArgs, Workspace['invitedTeam']>(
              cache,
              getCacheId('Workspace', workspaceId),
              (_fieldName, vars) => {
                if (vars.filter?.search?.length) return
                return invitedTeam.map((i) =>
                  getObjectReference('PendingWorkspaceCollaborator', i.id)
                )
              },
              {
                fieldNameWhitelist: ['invitedTeam']
              }
            )

            // Evict the cache for the invited team if the search filter is active
            evictObjectFields<WorkspaceInvitedTeamArgs, Workspace['invitedTeam']>(
              cache,
              getCacheId('Workspace', workspaceId),
              (fieldName, vars) => {
                if (fieldName !== 'invitedTeam') return false
                return vars.filter?.search?.length !== 0
              }
            )
          }
        }
      ).catch(convertThrowIntoFetchResult)) || {}

    if (!data?.workspaceMutations.invites.batchCreate.id) {
      const err = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Invitation failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Invite successfully sent'
      })
    }

    return data?.workspaceMutations.invites.batchCreate
  }
}

export const useProcessWorkspaceInvite = () => {
  const { mutate } = useMutation(processWorkspaceInviteMutation)
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const mp = useMixpanel()

  return async (params: { input: WorkspaceInviteUseInput }) => {
    if (!activeUser.value) return

    const { input } = params
    const { data, errors } =
      (await mutate(
        { input },
        {
          update: (cache, { data }) => {
            if (!data?.workspaceMutations.invites.use) return

            // Evict Query.workspace & User.workspaces

            // Update Query.workspaceInvite & User.workspaceInvites
          }
        }
      ).catch(convertThrowIntoFetchResult)) || {}

    if (data?.workspaceMutations.invites.use) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: input.accept ? 'Invite accepted' : 'Invite dismissed'
      })
      mp.track('Invite Action', {
        type: 'workspace invite',
        accepted: input.accept
      })
    } else {
      const err = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to process invite',
        description: err
      })
    }

    return !!data?.workspaceMutations.invites.use
  }
}
