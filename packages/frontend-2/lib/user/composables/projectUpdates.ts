import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import { UserProjectsUpdatedMessageType } from '~/lib/common/generated/gql/graphql'
import { getCacheId, modifyObjectField } from '~/lib/common/helpers/graphql'
import { ToastNotificationType, useGlobalToast } from '~/lib/common/composables/toast'
import { projectRoute } from '~/lib/common/helpers/route'

export function useUserProjectsUpdatedTracking() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { activeUser } = useActiveUser()

  const { onResult: onUserProjectsUpdate } = useSubscription(
    graphql(`
      subscription OnUserProjectsUpdate {
        userProjectsUpdated {
          type
          id
          project {
            ...ProjectDashboardItem
            workspaceId
          }
        }
      }
    `),
    {},
    () => ({
      errorPolicy: 'all'
    })
  )

  onUserProjectsUpdate((res) => {
    const activeUserId = activeUser.value?.id
    const event = res.data?.userProjectsUpdated

    if (!event) return
    if (!activeUserId) return

    const isNewProject = event.type === UserProjectsUpdatedMessageType.Added
    const incomingProject = event.project
    const cache = apollo.cache

    if (isNewProject && incomingProject) {
      // Add to User.projects where possible
      modifyObjectField(
        cache,
        getCacheId('User', activeUserId),
        'projects',
        ({ helpers: { ref, createUpdatedValue }, variables }) => {
          if (incomingProject.workspaceId && variables.filter?.personalOnly) {
            return // skip, not a personal project
          }
          if (
            variables.filter?.workspaceId &&
            variables.filter?.workspaceId !== incomingProject.workspaceId
          ) {
            return // skip, not in the workspace
          }

          return createUpdatedValue(({ update }) => {
            update('items', (items) => [
              ref('Project', incomingProject.id),
              ...(items || [])
            ])
            update('totalCount', (count) => count + 1)
          })
        },
        { autoEvictFiltered: true }
      )
    }

    if (!isNewProject) {
      // Evict old project from cache entirely to remove it from all searches
      cache.evict({
        id: getCacheId('Project', event.id)
      })
    }

    // Emit toast notification
    triggerNotification({
      type: ToastNotificationType.Info,
      title: isNewProject ? 'New project added' : 'A project has been removed',
      cta:
        isNewProject && incomingProject
          ? {
              url: projectRoute(incomingProject.id),
              title: 'View project'
            }
          : undefined
    })
  })
}
