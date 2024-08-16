import { useApolloClient, useMutation } from '@vue/apollo-composable'
import type {
  SettingsSidebarQuery,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceInviteCreateInput,
  WorkspaceInvitedTeamArgs
} from '~/lib/common/generated/gql/graphql'
import {
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage,
  getObjectReference,
  modifyObjectFields,
  ROOT_QUERY
} from '~/lib/common/helpers/graphql'
import {
  createWorkspaceMutation,
  inviteToWorkspaceMutation
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

export function useCreateWorkspace() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()

  return async (input: WorkspaceCreateInput) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const res = await apollo
      .mutate({
        mutation: createWorkspaceMutation,
        variables: { input },
        update: (cache, { data }) => {
          const newWorkspace = data?.workspaceMutations.create

          if (newWorkspace?.id) {
            // Update existing cache for workspaces
            modifyObjectFields<undefined, { [key: string]: SettingsSidebarQuery }>(
              cache,
              ROOT_QUERY,
              (_fieldName, _variables, value, details) => {
                const workspaceListFields = Object.keys(value).filter(
                  (k) =>
                    details.revolveFieldNameAndVariables(k).fieldName ===
                    'workspaceList'
                )
                const newVal: typeof value = { ...value }
                for (const field of workspaceListFields) {
                  delete newVal[field]
                }
                return newVal
              },
              { fieldNameWhitelist: ['workspace'] }
            )
          }
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (!res.data?.workspaceMutations.create.id) {
      const err = getFirstErrorMessage(res.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Workspace creation failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace successfully created'
      })
    }

    return res
  }
}
