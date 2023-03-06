import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  OnProjectUpdatedSubscription,
  ProjectCreateInput,
  ProjectInviteCreateInput,
  ProjectUpdatedMessageType,
  ProjectUpdateRoleInput
} from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import {
  cancelProjectInviteMutation,
  createProjectMutation,
  inviteProjectUserMutation,
  updateProjectRoleMutation
} from '~~/lib/projects/graphql/mutations'
import { onProjectUpdatedSubscription } from '~~/lib/projects/graphql/subscriptions'

/**
 * Note: Only invoke this once per project per page, because it handles all kinds of cache updates
 * that we don't want to duplicate (or extract that part out into a separate composable)
 */
export function useProjectUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<Get<OnProjectUpdatedSubscription, 'projectUpdated'>>,
    cache: ApolloCache<unknown>
  ) => void
) {
  const apollo = useApolloClient().client
  const { onResult: onProjectUpdated } = useSubscription(
    onProjectUpdatedSubscription,
    () => ({
      id: unref(projectId)
    })
  )

  onProjectUpdated((res) => {
    if (!res.data?.projectUpdated) return

    const event = res.data.projectUpdated
    const cache = apollo.cache
    const isDeleted = event.type === ProjectUpdatedMessageType.Deleted

    if (isDeleted) {
      cache.evict({
        id: getCacheId('Project', event.id)
      })
    }

    handler?.(event, cache)
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
        variables: { input }
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

  return async (input: ProjectInviteCreateInput) => {
    const userId = activeUser.value?.id
    if (!userId) return

    const { data, errors } = await apollo
      .mutate({
        mutation: inviteProjectUserMutation,
        variables: { input }
      })
      .catch(convertThrowIntoFetchResult)

    if (!data?.projectMutations.invites.create.id) {
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

    return data?.projectMutations.invites.create
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
