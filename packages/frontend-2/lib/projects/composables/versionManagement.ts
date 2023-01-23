import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { SpeckleViewer } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  OnProjectVersionsUpdateSubscription,
  ProjectVersionsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { onProjectVersionsUpdateSubscription } from '~~/lib/projects/graphql/subscriptions'
import { evictObjectFields, getCacheId } from '~~/lib/common/helpers/graphql'

export function useProjectVersionUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<
      Get<OnProjectVersionsUpdateSubscription, 'projectVersionsUpdated'>
    >,
    cache: ApolloCache<unknown>
  ) => void,
  options?: Partial<{
    silenceToast: boolean
  }>
) {
  /**
  //  * TODO: Delete/update version
  //  * On creation:
  //  * - Update model.previewUrl
  //  * On create/update:
  //  * - Update model.updatedAt
   *
   * Handler:
  //  * - Projects dashboard: Re-calculate top 4 models (maybe need full model fragment then?)
  //  * - Project page: Reload models queries
   * - Viewer: Re-calculate models versions
   */

  const { silenceToast = false } = options || {}
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { onResult: onProjectVersionsUpdate } = useSubscription(
    onProjectVersionsUpdateSubscription,
    () => ({
      id: unref(projectId)
    })
  )

  onProjectVersionsUpdate((res) => {
    if (!res.data?.projectVersionsUpdated) return

    const event = res.data.projectVersionsUpdated
    const version = event.version
    if (
      [
        ProjectVersionsUpdatedMessageType.Created,
        ProjectVersionsUpdatedMessageType.Updated
      ].includes(event.type) &&
      version
    ) {
      if (event.type === ProjectVersionsUpdatedMessageType.Created) {
        // Emit toast
        if (!silenceToast) {
          triggerNotification({
            type: ToastNotificationType.Info,
            title: 'A new version was created!',
            cta: {
              title: 'View Version',
              url: modelRoute(
                unref(projectId),
                SpeckleViewer.ViewerRoute.resourceBuilder()
                  .addModel(version.model.id, version.id)
                  .toString()
              )
            }
          })
        }
      }
    } else if (event.type === ProjectVersionsUpdatedMessageType.Deleted) {
      // Delete from cache
      apollo.cache.evict({
        id: getCacheId('Version', event.id)
      })

      if (event.modelId) {
        // Evict stale model fields
        evictObjectFields(
          apollo.cache,
          getCacheId('Model', event.modelId),
          (fieldName) =>
            ['updatedAt', 'previewUrl', 'versionCount', 'versions'].includes(fieldName)
        )
      }
    }

    handler?.(event, apollo.cache)
  })
}
