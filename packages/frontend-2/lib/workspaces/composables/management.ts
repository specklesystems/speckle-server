import type { RouteLocationNormalized } from 'vue-router'
import { waitForever, type MaybeAsync, type Optional } from '@speckle/shared'
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type {
  UseWorkspaceInviteManager_PendingWorkspaceCollaboratorFragment,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceInviteCreateInput,
  WorkspaceInvitedTeamArgs,
  WorkspaceInviteUseInput,
  WorkspaceRoleUpdateInput
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
  createWorkspaceMutation,
  inviteToWorkspaceMutation,
  processWorkspaceInviteMutation,
  setDefaultRegionMutation,
  workspaceUpdateRoleMutation
} from '~/lib/workspaces/graphql/mutations'
import { isFunction } from 'lodash-es'
import type { GraphQLError } from 'graphql'

export const useInviteUserToWorkspace = () => {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate } = useMutation(inviteToWorkspaceMutation)
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  return async (workspaceId: string, inputs: WorkspaceInviteCreateInput[]) => {
    const userId = activeUser.value?.id
    if (!userId) return
    if (!isWorkspacesEnabled.value) return

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
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

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
      preventErrorToasts?:
        | boolean
        | ((errors: GraphQLError[], errMsg: string) => boolean)
    }>
  ) => {
    if (!isWorkspacesEnabled.value) return
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
              modifyObjectField(
                cache,
                ROOT_QUERY,
                'workspace',
                ({ variables, helpers: { evict } }) => {
                  if (variables.id === workspaceId) return evict()
                }
              )

              // Evict all User.workspaces
              modifyObjectField(
                cache,
                getCacheId('User', userId),
                'workspaces',
                ({ helpers: { evict } }) => evict()
              )
            }

            // Set Query.workspaceInvite(id) = null (no invite)
            modifyObjectField(
              cache,
              ROOT_QUERY,
              'workspaceInvite',
              ({ value, variables, helpers: { readField } }) => {
                if (value) {
                  const inviteWorkspaceId = readField(value, 'workspaceId')
                  if (inviteWorkspaceId === workspaceId) return null
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

      mp.track('Workspace Joined', {
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })

      mp.track('Invite Action', {
        type: 'workspace invite',
        accepted: input.accept,
        // eslint-disable-next-line camelcase
        workspace_id: workspaceId
      })
    } else {
      const err = getFirstErrorMessage(errors)
      const preventErrorToasts = isFunction(options?.preventErrorToasts)
        ? options?.preventErrorToasts(errors?.slice() || [], err)
        : options?.preventErrorToasts

      if (!preventErrorToasts) {
        const err = getFirstErrorMessage(errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Failed to process invite',
          description: err
        })
      }
    }

    return !!data?.workspaceMutations.invites.use
  }
}

graphql(`
  fragment UseWorkspaceInviteManager_PendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    token
    workspaceId
    workspaceSlug
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
    preventErrorToasts: boolean | ((errors: GraphQLError[], errMsg: string) => boolean)
  }>
) => {
  const isWorkspacesEnabled = useIsWorkspacesEnabled()
  const { invite } = params
  const { preventRedirect, preventErrorToasts } = options || {}

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
    if (!isWorkspacesEnabled.value) return false
    if (!token.value || !invite.value) return false

    const workspaceId = invite.value.workspaceId
    const workspaceSlug = invite.value.workspaceSlug
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
            if (workspaceSlug) {
              window.location.href = workspaceRoute(workspaceSlug)
            } else {
              window.location.reload()
            }
            await waitForever() // to prevent UI changes while reload is happening
          } else {
            await goHome()
          }
        },
        preventErrorToasts
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

export function useCreateWorkspace() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()
  const router = useRouter()
  const mixpanel = useMixpanel()

  return async (
    input: WorkspaceCreateInput,
    options?: Partial<{
      /**
       * Determines whether to navigate to the new workspace upon creation.
       * Defaults to false.
       */
      navigateOnSuccess: boolean
    }>,
    eventProperties?: Partial<{
      /**
       * Used for sending the Mixpanel event
       */
      source: string
    }>
  ) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const res = await apollo
      .mutate({
        mutation: createWorkspaceMutation,
        variables: { input },
        update: (cache, { data }) => {
          const workspaceId = data?.workspaceMutations.create.id
          if (!workspaceId) return
          // Navigation to workspace is gonna fetch everything needed for the page, so we only
          // really need to update workspace fields used in sidebar & settings: User.workspaces
          modifyObjectField(
            cache,
            getCacheId('User', userId),
            'workspaces',
            ({ helpers: { createUpdatedValue, ref } }) => {
              return createUpdatedValue(({ update }) => {
                update('totalCount', (totalCount) => totalCount + 1)
                update('items', (items) => [...items, ref('Workspace', workspaceId)])
              })
            },
            {
              autoEvictFiltered: true
            }
          )
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (res.data?.workspaceMutations.create.id) {
      mixpanel.track('Workspace Created', {
        source: eventProperties?.source,
        fields: Object.keys(input) as Array<keyof WorkspaceCreateInput>,
        // eslint-disable-next-line camelcase
        workspace_id: res.data?.workspaceMutations.create.id
      })

      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace successfully created'
      })

      if (options?.navigateOnSuccess === true) {
        router.push(workspaceRoute(res.data?.workspaceMutations.create.slug))
      }
    } else {
      const err = getFirstErrorMessage(res.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Workspace creation failed',
        description: err
      })
    }

    return res
  }
}

export const useWorkspaceUpdateRole = () => {
  const { mutate } = useMutation(workspaceUpdateRoleMutation)
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  return async (input: WorkspaceRoleUpdateInput) => {
    const result = await mutate(
      { input },
      {
        update: (cache) => {
          if (!input.role) {
            cache.evict({
              id: getCacheId('WorkspaceCollaborator', input.userId)
            })

            modifyObjectField(
              cache,
              getCacheId('Workspace', input.workspaceId),
              'team',
              ({ helpers: { createUpdatedValue } }) => {
                return createUpdatedValue(({ update }) => {
                  update('totalCount', (totalCount) => totalCount - 1)
                })
              },
              {
                autoEvictFiltered: true
              }
            )
          }
        }
      }
    ).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: input.role ? 'User role updated' : 'User removed',
        description: input.role
          ? 'The user role has been updated'
          : 'The user has been removed from the workspace'
      })

      if (input.role) {
        mixpanel.track('Workspace User Role Updated', {
          newRole: input.role,
          // eslint-disable-next-line camelcase
          workspace_id: input.workspaceId
        })
      } else {
        mixpanel.track('Workspace User Removed', {
          // eslint-disable-next-line camelcase
          workspace_id: input.workspaceId
        })
      }
    } else {
      const errorMessage = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: input.role ? 'Failed to update role' : 'Failed to remove user',
        description: errorMessage
      })
    }
  }
}

export const copyWorkspaceLink = async (slug: string) => {
  const { copy } = useClipboard()
  const { triggerNotification } = useGlobalToast()

  const url = new URL(workspaceRoute(slug), window.location.toString()).toString()

  await copy(url)
  triggerNotification({
    type: ToastNotificationType.Success,
    title: 'Copied workspace link to clipboard'
  })
}

export const useSetDefaultWorkspaceRegion = () => {
  const { mutate } = useMutation(setDefaultRegionMutation)
  const { triggerNotification } = useGlobalToast()

  return async (params: { workspaceId: string; regionKey: string }) => {
    const { workspaceId, regionKey } = params
    const res = await mutate({ workspaceId, regionKey }).catch(
      convertThrowIntoFetchResult
    )

    if (res?.data?.workspaceMutations.setDefaultRegion) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Default region set successfully'
      })
    } else {
      const err = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to set default region',
        description: err
      })
    }

    return res?.data?.workspaceMutations.setDefaultRegion
  }
}
