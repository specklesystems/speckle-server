import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useQuery, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { Nullable, SpeckleViewer } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  DeleteVersionsInput,
  MoveVersionsInput,
  OnProjectVersionsUpdateSubscription,
  ProjectVersionsUpdatedMessageType,
  UpdateVersionInput
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import { onProjectVersionsUpdateSubscription } from '~~/lib/projects/graphql/subscriptions'
import {
  CacheObjectReference,
  convertThrowIntoFetchResult,
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { projectModelVersionsQuery } from '~~/lib/projects/graphql/queries'
import {
  deleteVersionsMutation,
  moveVersionsMutation,
  updateVersionMutation
} from '~~/lib/projects/graphql/mutations'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

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
    cursor.value = res.data.project?.model?.versions.cursor || null
  })

  const versions = computed(() => result.value?.project?.model?.versions)
  const moreToLoad = computed(
    () =>
      (!versions.value || versions.value.items.length < versions.value.totalCount) &&
      cursor.value
  )

  const loadMore = () => {
    if (!moreToLoad.value) return
    return fetchMore({ variables: { versionsCursor: cursor.value } })
  }

  return {
    versions,
    loadMore,
    moreToLoad
  }
}

export function useDeleteVersions() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (input: DeleteVersionsInput) => {
    if (!input.versionIds.length) return
    if (!isLoggedIn.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: deleteVersionsMutation,
        variables: { input },
        update: (cache, { data }) => {
          if (!data?.versionMutations.delete) return

          // Evict all versions from cache
          for (const versionId of input.versionIds) {
            cache.evict({
              id: getCacheId('Version', versionId)
            })
          }
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.versionMutations.delete) {
      const deleteCount = input.versionIds.length
      triggerNotification({
        type: ToastNotificationType.Info,
        title: `${deleteCount} version${deleteCount > 1 ? 's' : ''} deleted`
      })
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Version deletion failed',
        description: errMsg
      })
    }

    return !!data?.versionMutations.delete
  }
}

export function useMoveVersions() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (
    input: MoveVersionsInput,
    options?: Partial<{ previousModelId: string }>
  ) => {
    if (!input.versionIds.length || !input.targetModelName.trim()) return
    if (!isLoggedIn.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: moveVersionsMutation,
        variables: { input },
        update: (cache, { data }) => {
          if (!data?.versionMutations.moveToModel.id) return

          const previousModelId = options?.previousModelId
          if (!previousModelId) return

          // Remove from previous model's versions
          modifyObjectFields<{ id: string }>(
            cache,
            getCacheId('Model', previousModelId),
            (fieldName, variables) => {
              if (fieldName !== 'version') return
              if (!input.versionIds.includes(variables.id)) return

              // Set to null
              return null
            }
          )

          modifyObjectFields<
            undefined,
            Partial<{
              totalCount: number
              cursor: string
              items: Array<CacheObjectReference>
            }>
          >(
            cache,
            getCacheId('Model', previousModelId),
            (fieldName, _variables, data) => {
              if (fieldName !== 'versions') return
              if (!data.items) return

              const oldItems = data.items
              const newItems = oldItems.filter(
                (i) => !input.versionIds.includes(i.__ref)
              )
              if (oldItems.length === newItems.length) return

              return {
                ...data,
                items: newItems
              }
            }
          )
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.versionMutations.moveToModel.id) {
      const deleteCount = input.versionIds.length
      triggerNotification({
        type: ToastNotificationType.Info,
        title: `${deleteCount} version${deleteCount > 1 ? 's' : ''} moved`
      })
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Version move failed',
        description: errMsg
      })
    }

    return !!data?.versionMutations.moveToModel.id
  }
}

export function useUpdateVersion() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const { isLoggedIn } = useActiveUser()

  return async (input: UpdateVersionInput) => {
    if (!input.versionId) return
    if (!isLoggedIn.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: updateVersionMutation,
        variables: { input }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.versionMutations.update.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: `Version successfully updated`
      })
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Version update failed',
        description: errMsg
      })
    }

    return data?.versionMutations.update
  }
}
