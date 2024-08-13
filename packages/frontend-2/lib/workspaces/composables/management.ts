import { useMutation } from '@vue/apollo-composable'
import type {
  Workspace,
  WorkspaceInviteCreateInput,
  WorkspaceInvitedTeamArgs
} from '~/lib/common/generated/gql/graphql'
import {
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage,
  getObjectReference,
  modifyObjectFields
} from '~/lib/common/helpers/graphql'
import { inviteToWorkspaceMutation } from '~/lib/workspaces/graphql/mutations'

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
