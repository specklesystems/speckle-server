import { useMutation } from '@vue/apollo-composable'
import type {
  Query,
  QueryWorkspaceArgs,
  QueryWorkspaceInviteArgs,
  User,
  UserWorkspacesArgs,
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
  modifyObjectField,
  modifyObjectFields,
  ROOT_QUERY
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

  return async (params: {
    input: WorkspaceInviteUseInput
    workspaceId: string
    inviteId: string
  }) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { input, workspaceId, inviteId } = params
    const { data, errors } =
      (await mutate(
        { input },
        {
          update: (cache, { data, errors }) => {
            if (errors?.length) return

            const accepted = data?.workspaceMutations.invites.use

            if (accepted) {
              // Evict Query.workspace
              modifyObjectField<Query['workspace'], QueryWorkspaceArgs>(
                cache,
                ROOT_QUERY,
                'workspace',
                ({ variables, details: { DELETE } }) => {
                  if (variables.id === workspaceId) return DELETE
                }
              )

              // Evict all User.workspaces
              modifyObjectField<User['workspaces'], UserWorkspacesArgs>(
                cache,
                getCacheId('User', userId),
                'workspaces',
                ({ details: { DELETE } }) => DELETE
              )
            }

            // Set Query.workspaceInvite(id) = null (no invite)
            modifyObjectField<Query['workspaceInvite'], QueryWorkspaceInviteArgs>(
              cache,
              ROOT_QUERY,
              'workspaceInvite',
              ({ value, variables, details: { readField } }) => {
                if (value) {
                  const workspaceId = readField('workspaceId', value)
                  if (workspaceId === workspaceId) return null
                } else {
                  if (variables.workspaceId === workspaceId) return null
                }
              }
            )

            // Evict invite itself
            cache.evict({
              id: getCacheId('PendingWorkspaceCollaborator', inviteId)
            })
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
