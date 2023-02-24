import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  OnProjectUpdatedSubscription,
  ProjectCreateInput,
  ProjectUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { createProjectMutation } from '~~/lib/projects/graphql/mutations'
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
