import { ApolloCache } from '@apollo/client/core'
import { OnModelVersionCardAutomationsStatusUpdatedSubscription } from '~~/lib/common/generated/gql/graphql'
import { Get } from 'type-fest'
import { onModelVersionCardAutomationsStatusUpdated } from '~~/lib/automations/graphql/subscriptions'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { useLock } from '~~/lib/common/composables/singleton'
import { getCacheId, getObjectReference } from '~~/lib/common/helpers/graphql'

/**
 * Track project model/version automations status updates and makes cache updates accordingly.
 * Optionally you can provide an extra handler to be called when an event is received.
 */
export const useModelVersionCardAutomationsStatusUpdateTracking = (
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<
      Get<
        OnModelVersionCardAutomationsStatusUpdatedSubscription,
        'projectAutomationsStatusUpdated'
      >
    >,
    cache: ApolloCache<unknown>
  ) => void
) => {
  const { onResult } = useSubscription(
    onModelVersionCardAutomationsStatusUpdated,
    () => ({
      projectId: unref(projectId)
    })
  )

  const { hasLock } = useLock(
    computed(
      () => `useModelVersionCardAutomationsStatusUpdateTracking-${unref(projectId)}`
    )
  )

  const apollo = useApolloClient().client

  onResult((result) => {
    if (!result.data?.projectAutomationsStatusUpdated || !hasLock.value) return

    // Add to model/version automationsStatus field, in case it was null before
    const {
      model: { id: modelId, versions: { items: [latestVersion] = [] } = {} },
      version: { id: versionId },
      status: { id: statusId }
    } = result.data.projectAutomationsStatusUpdated

    apollo.cache.modify({
      id: getCacheId('Version', versionId),
      fields: {
        automationStatus: () => getObjectReference('AutomationsStatus', statusId)
      }
    })

    // Set as model's automationStatus only if version is latest version
    if (latestVersion?.id === versionId) {
      apollo.cache.modify({
        id: getCacheId('Model', modelId),
        fields: {
          automationStatus: () => getObjectReference('AutomationsStatus', statusId)
        }
      })
    }
  })

  onResult((result) => {
    if (!result.data?.projectAutomationsStatusUpdated) return
    const event = result.data.projectAutomationsStatusUpdated
    handler?.(event, apollo.cache)
  })
}
