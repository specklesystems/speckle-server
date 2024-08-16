import type { RouteLocationNormalized } from '#vue-router'
import { waitForever, type MaybeAsync, type Optional } from '@speckle/shared'
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  Query,
  QueryWorkspaceArgs,
  QueryWorkspaceInviteArgs,
  User,
  UserWorkspacesArgs,
  UseWorkspaceInviteManager_PendingWorkspaceCollaboratorFragment,
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
import { useNavigateToHome, workspaceRoute } from '~/lib/common/helpers/route'
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

  return async (
    params: {
      input: WorkspaceInviteUseInput
      workspaceId: string
      inviteId: string
    },
    options?: Partial<{
      /**
       * Do something once mutation has finished, before all cache updates
       */
      callback: () => MaybeAsync<void>
    }>
  ) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { input, workspaceId, inviteId } = params
    const { data, errors } =
      (await mutate(
        { input },
        {
          update: async (cache, { data, errors }) => {
            if (errors?.length) return

            if (options?.callback) await options.callback()
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

graphql(`
  fragment UseWorkspaceInviteManager_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    token
    workspaceId
    user {
      id
    }
  }
`)

export const useWorkspaceInviteManager = <
  Invite extends UseWorkspaceInviteManager_PendingWorkspaceCollaboratorFragment = UseWorkspaceInviteManager_PendingWorkspaceCollaboratorFragment
>(
  params: {
    invite: Ref<Optional<Invite>>
  },
  options?: Partial<{
    /**
     * Whether to prevent any reloads/redirects on successful processing of the invite
     */
    preventRedirect: boolean
    route: RouteLocationNormalized
  }>
) => {
  const { invite } = params
  const { preventRedirect } = options || {}

  const useInvite = useProcessWorkspaceInvite()
  const route = options?.route || useRoute()
  const goHome = useNavigateToHome()
  const { activeUser } = useActiveUser()

  const loading = ref(false)

  const token = computed(
    () => (route.query.token as Optional<string>) || invite.value?.token
  )
  const isCurrentUserTarget = computed(
    () =>
      activeUser.value &&
      invite.value?.user &&
      activeUser.value.id === invite.value.user.id
  )
  const targetUser = computed((): Invite['user'] => invite.value?.user)
  const needsToAddNewEmail = computed(
    () => !isCurrentUserTarget.value && !targetUser.value
  )
  const canAddNewEmail = computed(() => needsToAddNewEmail.value && token.value)

  const processInvite = async (
    accept: boolean,
    options?: Partial<{
      /**
       * If invite is attached to an unregistered email, the invite can only be used if this is set to true.
       * Upon accepting such an invite, the unregistered email will be added to the user's account as well.
       */
      addNewEmail: boolean
    }>
  ) => {
    const { addNewEmail } = options || {}
    if (!token.value || !invite.value) return false
    if (needsToAddNewEmail.value && !addNewEmail) return false

    const workspaceId = invite.value.workspaceId
    const shouldAddNewEmail = canAddNewEmail.value && addNewEmail

    loading.value = true
    const success = await useInvite(
      {
        workspaceId,
        input: {
          accept,
          token: token.value,
          ...(shouldAddNewEmail ? { addNewEmail: shouldAddNewEmail } : {})
        },
        inviteId: invite.value.id
      },
      {
        callback: async () => {
          if (preventRedirect) return

          // Redirect
          if (accept) {
            if (workspaceId) {
              window.location.href = workspaceRoute(workspaceId)
            } else {
              window.location.reload()
            }
            await waitForever() // to prevent UI changes while reload is happening
          } else {
            await goHome()
          }
        }
      }
    )
    loading.value = false

    return !!success
  }

  return {
    loading: computed(() => loading.value),
    token,
    isCurrentUserTarget,
    targetUser,
    accept: (options?: Parameters<typeof processInvite>[1]) =>
      processInvite(true, options),
    decline: (options?: Parameters<typeof processInvite>[1]) =>
      processInvite(false, options)
  }
}
