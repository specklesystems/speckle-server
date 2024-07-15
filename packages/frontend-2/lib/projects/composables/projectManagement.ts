import type { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import type { MaybeRef } from '@vueuse/core'
import { isArray } from 'lodash-es'
import type { Get } from 'type-fest'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useLock } from '~~/lib/common/composables/singleton'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { ProjectUpdatedMessageType } from '~~/lib/common/generated/gql/graphql'
import type {
  OnProjectUpdatedSubscription,
  ProjectCreateInput,
  ProjectInviteCreateInput,
  ProjectInviteUseInput,
  ProjectUpdateInput,
  ProjectUpdateRoleInput,
  UpdateProjectMetadataMutation,
  AdminPanelProjectsListQuery
} from '~~/lib/common/generated/gql/graphql'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import {
  cancelProjectInviteMutation,
  createProjectMutation,
  deleteProjectMutation,
  inviteProjectUserMutation,
  leaveProjectMutation,
  updateProjectMetadataMutation,
  updateProjectRoleMutation,
  useProjectInviteMutation
} from '~~/lib/projects/graphql/mutations'
import { onProjectUpdatedSubscription } from '~~/lib/projects/graphql/subscriptions'

export function useProjectUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<Get<OnProjectUpdatedSubscription, 'projectUpdated'>>,
    cache: ApolloCache<unknown>
  ) => void,
  options?: Partial<{
    redirectOnDeletion: boolean
    notifyOnUpdate?: boolean
  }>
) {
  const { redirectOnDeletion, notifyOnUpdate } = options || {}

  const goHome = useNavigateToHome()
  const { triggerNotification } = useGlobalToast()
  const apollo = useApolloClient().client
  const { hasLock } = useLock(
    computed(() => `useProjectUpdateTracking-${unref(projectId)}`)
  )
  const isEnabled = computed(() => !!(hasLock.value || handler))

  const { onResult: onProjectUpdated } = useSubscription(
    onProjectUpdatedSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )

  onProjectUpdated((res) => {
    if (!res.data?.projectUpdated || !hasLock.value) return

    const event = res.data.projectUpdated
    const cache = apollo.cache
    const isDeleted = event.type === ProjectUpdatedMessageType.Deleted

    if (isDeleted) {
      cache.evict({
        id: getCacheId('Project', event.id)
      })

      if (redirectOnDeletion) {
        goHome()
      }

      if (redirectOnDeletion || notifyOnUpdate) {
        triggerNotification({
          type: ToastNotificationType.Info,
          title: isDeleted ? 'Project deleted' : 'Project updated',
          description: isDeleted ? 'Redirecting to home' : undefined
        })
      }
    }
  })

  onProjectUpdated((res) => {
    if (!res.data?.projectUpdated) return
    const event = res.data.projectUpdated
    handler?.(event, apollo.cache)
  })
}

export function useCreateProject() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()

  return async (input: ProjectCreateInput) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const res = await apollo
      .mutate({
        mutation: createProjectMutation,
        variables: { input },
        update: (cache, { data }) => {
          if (data?.projectMutations.create.id) {
            modifyObjectFields<
              undefined,
              { [key: string]: AdminPanelProjectsListQuery }
            >(
              cache,
              ROOT_QUERY,
              (fieldName, _variables, value, details) => {
                const projectListFields = Object.keys(value).filter(
                  (k) =>
                    details.revolveFieldNameAndVariables(k).fieldName === 'projectList'
                )
                const newVal: typeof value = { ...value }
                for (const field of projectListFields) {
                  delete newVal[field]
                }
                return newVal
              },
              { fieldNameWhitelist: ['admin'] }
            )
          }
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (!res.data?.projectMutations.create.id) {
      const err = getFirstErrorMessage(res.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Project creation failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Project successfully created'
      })
    }

    return res
  }
}

export function useUpdateUserRole() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (input: ProjectUpdateRoleInput) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } = await apollo
      .mutate({
        mutation: updateProjectRoleMutation,
        variables: { input }
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.projectMutations.updateRole.id) {
      const err = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Permission update failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Project permissions updated'
      })
    }

    return data?.projectMutations.updateRole
  }
}

export function useInviteUserToProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (
    projectId: string,
    input: ProjectInviteCreateInput | ProjectInviteCreateInput[]
  ) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } = await apollo
      .mutate({
        mutation: inviteProjectUserMutation,
        variables: { input: isArray(input) ? input : [input], projectId }
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.projectMutations.invites.batchCreate.id) {
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

    return data?.projectMutations.invites.batchCreate
  }
}

export function useCancelProjectInvite() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (input: { projectId: string; inviteId: string }) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } = await apollo
      .mutate({
        mutation: cancelProjectInviteMutation,
        variables: input
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.projectMutations.invites.cancel) {
      const err = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Invitation cancelation failed',
        description: err
      })
    } else {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Invitation canceled'
      })
    }

    return data?.projectMutations.invites.cancel
  }
}

export function useUpdateProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (
    update: ProjectUpdateInput,
    options?: Partial<{
      customSuccessMessage?: string
      optimisticResponse: UpdateProjectMetadataMutation
    }>
  ) => {
    if (!activeUser.value) return

    const successMessage = options?.customSuccessMessage || 'Project updated'

    const result = await apollo
      .mutate({
        mutation: updateProjectMetadataMutation,
        variables: { update },
        optimisticResponse: options?.optimisticResponse
      })
      .catch(convertThrowIntoFetchResult)

    if (result?.data?.projectMutations.update?.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: successMessage
      })
    } else {
      const errMsg = getFirstErrorMessage(result.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Project update failed',
        description: errMsg
      })
    }

    return result.data?.projectMutations.update
  }
}

export function useDeleteProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const navigateHome = useNavigateToHome()

  return async (id: string, options?: Partial<{ goHome: boolean }>) => {
    if (!activeUser.value) return
    const { goHome } = options || {}

    const result = await apollo
      .mutate({
        mutation: deleteProjectMutation,
        variables: {
          id
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (result?.data?.projectMutations.delete) {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Project deleted'
      })

      if (goHome) {
        navigateHome()
      }

      // evict project from cache
      apollo.cache.evict({
        id: getCacheId('Project', id)
      })
    } else {
      const errMsg = getFirstErrorMessage(result.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Project deletion failed',
        description: errMsg
      })
    }

    return !!result.data?.projectMutations.delete
  }
}

export function useProcessProjectInvite() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (
    input: ProjectInviteUseInput,
    options?: Partial<{ inviteId: string; skipToast: boolean }>
  ) => {
    if (!activeUser.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: useProjectInviteMutation,
        variables: { input },
        update: (cache, { data }) => {
          if (!data?.projectMutations.invites.use) return

          if (options?.inviteId) {
            // Evict PendingStreamCollaborator
            cache.evict({
              id: getCacheId('PendingStreamCollaborator', options.inviteId)
            })
          }
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (!options?.skipToast) {
      if (data?.projectMutations.invites.use) {
        triggerNotification({
          type: input.accept
            ? ToastNotificationType.Success
            : ToastNotificationType.Info,
          title: input.accept ? 'Invite accepted' : 'Invite dismissed'
        })
      } else {
        const errMsg = getFirstErrorMessage(errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: "Couldn't process invite",
          description: errMsg
        })
      }
    }

    return data?.projectMutations.invites.use
  }
}

export function useLeaveProject() {
  const apollo = useApolloClient().client
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const navigateHome = useNavigateToHome()

  return async (projectId: string, options?: Partial<{ goHome: boolean }>) => {
    if (!activeUser.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: leaveProjectMutation,
        variables: { projectId },
        update: (cache, { data }) => {
          if (!data?.projectMutations.leave) return

          cache.evict({
            id: getCacheId('Project', projectId)
          })
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.projectMutations.leave) {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: "You've left the project"
      })

      if (options?.goHome) navigateHome()
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: "Couldn't leave project",
        description: errMsg
      })
    }
  }
}
