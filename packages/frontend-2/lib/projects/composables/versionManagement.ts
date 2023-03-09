import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useQuery, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { Nullable, SpeckleViewer } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  OnProjectVersionsUpdateSubscription,
  ProjectVersionsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { onProjectVersionsUpdateSubscription } from '~~/lib/projects/graphql/subscriptions'
import { evictObjectFields, getCacheId } from '~~/lib/common/helpers/graphql'
import { projectModelVersionsQuery } from '~~/lib/projects/graphql/queries'

/**
 * Note: Only invoke this once per project per page, because it handles all kinds of cache updates
 * that we don't want to duplicate (or extract that part out into a separate composable)
 */
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

export function useModelVersions(params: {
  projectId: MaybeRef<string>
  modelId: MaybeRef<string>
}) {
  const { projectId, modelId } = params

  const cursor = ref(null as Nullable<string>)
  const { result, fetchMore, onResult } = useQuery(projectModelVersionsQuery, () => ({
    projectId: unref(projectId),
    modelId: unref(modelId),
    versionsCursor: cursor.value
  }))

  onResult((res) => {
    if (!res.data.project?.model?.versions.cursor) return
    cursor.value = res.data.project.model.versions.cursor
  })

  const versions = computed(() => result.value?.project?.model?.versions)
  const moreToLoad = computed(
    () => !versions.value || versions.value.items.length !== versions.value.totalCount
  )

  const loadMore = () => {
    if (!moreToLoad.value) return
    if (!cursor.value) return
    return fetchMore({ variables: { versionsCursor: cursor.value } })
  }

  return {
    versions,
    loadMore,
    moreToLoad
  }
}
