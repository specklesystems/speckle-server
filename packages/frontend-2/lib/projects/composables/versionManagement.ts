import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useQuery, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { Nullable, SpeckleViewer } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  DeleteVersionsInput,
  Model,
  ModelPendingImportedVersionsArgs,
  ModelVersionArgs,
  ModelVersionsArgs,
  MoveVersionsInput,
  OnProjectPendingVersionsUpdatedSubscription,
  OnProjectVersionsUpdateSubscription,
  Project,
  ProjectModelsArgs,
  ProjectModelsTreeArgs,
  ProjectPendingImportedModelsArgs,
  ProjectPendingVersionsUpdatedMessageType,
  ProjectVersionsArgs,
  ProjectVersionsUpdatedMessageType,
  UpdateVersionInput
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import {
  onProjectPendingVersionsUpdatedSubscription,
  onProjectVersionsUpdateSubscription
} from '~~/lib/projects/graphql/subscriptions'
import {
  convertThrowIntoFetchResult,
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage,
  getObjectReference,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { projectModelVersionsQuery } from '~~/lib/projects/graphql/queries'
import {
  deleteVersionsMutation,
  moveVersionsMutation,
  updateVersionMutation
} from '~~/lib/projects/graphql/mutations'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useEvictProjectModelFields } from '~~/lib/projects/composables/modelManagement'
import { isUndefined, uniqBy } from 'lodash-es'
import { FileUploadConvertedStatus } from '~~/lib/core/api/fileImport'

/**
 * TODO: These aren't idempotent which makes them hard to use in multiple places. The moment you do so
 * bugs can arise like total count counters updating incorrectly etc.
 *
 * Even if it causes some over-fetching, we should convert these to be idempotent for easier maintenance and less bugs
 */

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
      // Added new model w/ versions OR updated model that now has versions (it might not have had them previously)
      // So - add it to the list, if its not already there
      modifyObjectFields<ProjectModelsArgs, Project['models']>(
        apollo.cache,
        getCacheId('Project', unref(projectId)),
        (fieldName, variables, value, { ref }) => {
          if (fieldName !== 'models') return
          if (variables.filter?.search) return

          const newModelRef = ref('Model', version.model.id)
          const newItems = (value?.items || []).slice()

          let isAdded = false
          if (!newItems.find((i) => i.__ref === newModelRef.__ref)) {
            newItems.unshift(newModelRef)
            isAdded = true
          }

          return {
            ...(value || {}),
            items: newItems,
            totalCount: (value.totalCount || 0) + (isAdded ? 1 : 0)
          }
        }
      )

      // + Evict modelsTree, if it doesnt have this model
      evictObjectFields<ProjectModelsTreeArgs, Project['modelsTree']>(
        apollo.cache,
        getCacheId('Project', unref(projectId)),
        (fieldName, variables, value, { readField }) => {
          if (fieldName !== 'modelsTree') return false
          if (variables.filter?.search) return false
          if (variables.filter?.contributors?.length) return false
          if (variables.filter?.sourceApps?.length) return false

          const items = value?.items || []
          for (const item of items) {
            const fullName = readField('fullName', item)
            if (fullName === version.model.name) return false
          }

          return true
        }
      )

      if (event.type === ProjectVersionsUpdatedMessageType.Created) {
        // Evict project.viewerResources
        evictObjectFields(
          apollo.cache,
          getCacheId('Project', unref(projectId)),
          (fieldName) => fieldName === 'viewerResources'
        )

        // Remove from pendingVersions, in case it's there
        modifyObjectFields<
          ModelPendingImportedVersionsArgs,
          Model['pendingImportedVersions']
        >(
          apollo.cache,
          getCacheId('Model', version.model.id),
          (fieldName, _variables, value, { readField }) => {
            if (fieldName !== 'pendingImportedVersions') return
            if (!value?.length) return

            // Unfortunately message matching is the best we can do
            const newMessage = version.message || ''
            const pendingWithFittingMessageIdx = (value || []).findIndex((i) => {
              const fileName = <string>readField('fileName', i) || ''
              return newMessage.includes(fileName)
            })

            const newVersions = (value || []).slice()
            if (pendingWithFittingMessageIdx !== -1) {
              newVersions.splice(pendingWithFittingMessageIdx, 1)
            }
            return newVersions
          }
        )

        // Add to model.versions
        modifyObjectFields<ModelVersionsArgs, Model['versions']>(
          apollo.cache,
          getCacheId('Model', version.model.id),
          (fieldName, _vars, value, { ref }) => {
            if (fieldName !== 'versions') return
            const newItems = (value?.items || []).slice()
            newItems.unshift(ref('Version', version.id))

            return {
              ...(value || {}),
              items: newItems,
              totalCount:
                version.model.versionCount.totalCount || (value.totalCount || 0) + 1
            }
          }
        )

        // Potentially remove item from Project.pendingImportedModels?
        // Remove from pending models?
        modifyObjectFields<
          ProjectPendingImportedModelsArgs,
          Project['pendingImportedModels']
        >(
          apollo.cache,
          getCacheId('Project', unref(projectId)),
          (fieldName, _variables, value, { readField }) => {
            if (fieldName !== 'pendingImportedModels') return
            if (!value?.length) return

            const versionModelName = version.model.name
            const currentModels = (value || []).filter((i) => {
              const itemModelName = readField('modelName', i)
              return itemModelName !== versionModelName
            })
            return currentModels
          }
        )

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

        // Evict project.viewerResources
        apollo.cache.evict({
          id: getCacheId('Project', unref(projectId)),
          fieldName: 'viewerResources'
        })
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

  return async (
    input: DeleteVersionsInput,
    /**
     * Various options for better cache updates, set if possible
     */
    options?: Partial<{
      projectId: string
      modelId: string
    }>
  ) => {
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

          // Update totalCounts in project
          if (options?.projectId) {
            modifyObjectFields<ProjectVersionsArgs, Project['versions']>(
              cache,
              getCacheId('Project', options.projectId),
              (fieldName, _variables, data) => {
                if (fieldName !== 'versions') return
                return {
                  ...data,
                  ...(!isUndefined(data.totalCount)
                    ? {
                        totalCount: Math.max(
                          data.totalCount - input.versionIds.length,
                          0
                        )
                      }
                    : {})
                }
              }
            )
          }

          // Update totalCounts in model
          if (options?.modelId) {
            modifyObjectFields<ModelVersionsArgs, Model['versions']>(
              cache,
              getCacheId('Model', options.modelId),
              (fieldName, _variables, data) => {
                if (fieldName !== 'versions') return
                return {
                  ...data,
                  ...(!isUndefined(data.totalCount)
                    ? {
                        totalCount: Math.max(
                          data.totalCount - input.versionIds.length,
                          0
                        )
                      }
                    : {})
                }
              }
            )
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
  const evictProjectModels = useEvictProjectModelFields()

  return async (
    input: MoveVersionsInput,
    options?: Partial<{
      previousModelId: string
      newModelCreated: boolean
      projectId: string
    }>
  ) => {
    if (!input.versionIds.length || !input.targetModelName.trim()) return
    if (!isLoggedIn.value) return

    const { data, errors } = await apollo
      .mutate({
        mutation: moveVersionsMutation,
        variables: { input },
        update: (cache, { data }) => {
          if (!data?.versionMutations.moveToModel.id) return

          const newModelId = data.versionMutations.moveToModel.id
          const previousModelId = options?.previousModelId
          if (!previousModelId) return

          // Remove from Model.version
          modifyObjectFields<ModelVersionArgs>(
            cache,
            getCacheId('Model', previousModelId),
            (fieldName, variables) => {
              if (fieldName !== 'version') return
              if (!input.versionIds.includes(variables.id)) return

              // Set to null
              return null
            }
          )

          // Remove from Model.versions
          modifyObjectFields<ModelVersionsArgs, Model['versions']>(
            cache,
            getCacheId('Model', previousModelId),
            (fieldName, _variables, data) => {
              if (fieldName !== 'versions') return

              const oldItems = data.items || []
              const newItems = oldItems.filter(
                (i) =>
                  !input.versionIds
                    .map((id) => getCacheId('Version', id))
                    .includes(i.__ref)
              )

              return {
                ...data,
                ...(data.items ? { items: newItems } : {}),
                ...(!isUndefined(data.totalCount)
                  ? {
                      totalCount: data.totalCount - input.versionIds.length
                    }
                  : {})
              }
            }
          )

          // Add to new model's Model.version
          modifyObjectFields<ModelVersionArgs>(
            cache,
            getCacheId('Model', newModelId),
            (fieldName, variables) => {
              if (fieldName !== 'version') return
              if (!input.versionIds.includes(variables.id)) return
              return getObjectReference('Version', variables.id)
            }
          )

          // Add to new model's Model.versions
          modifyObjectFields<ModelVersionsArgs, Model['versions']>(
            cache,
            getCacheId('Model', newModelId),
            (fieldName, _variables, data) => {
              if (fieldName !== 'versions') return

              const newItems = [
                ...input.versionIds.map((i) => getObjectReference('Version', i)),
                ...(data.items || [])
              ]

              return {
                ...data,
                ...(data.items ? { items: newItems } : {}),
                ...(!isUndefined(data.totalCount)
                  ? {
                      totalCount: data.totalCount + input.versionIds.length
                    }
                  : {})
              }
            }
          )

          if (options?.newModelCreated && options?.projectId) {
            evictProjectModels(options.projectId)
          }
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

/**
 * Note: Only invoke this once per project per page, because it handles all kinds of cache updates
 * that we don't want to duplicate (or extract that part out into a separate composable)
 */
export function useProjectPendingVersionUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<
      Get<OnProjectPendingVersionsUpdatedSubscription, 'projectPendingVersionsUpdated'>
    >,
    cache: ApolloCache<unknown>
  ) => void
) {
  const { onResult: onProjectPendingVersionsUpdate } = useSubscription(
    onProjectPendingVersionsUpdatedSubscription,
    () => ({
      id: unref(projectId)
    })
  )
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  onProjectPendingVersionsUpdate((res) => {
    if (!res.data?.projectPendingVersionsUpdated.id) return
    const event = res.data.projectPendingVersionsUpdated
    const modelId = event.version.model?.id
    if (!modelId) return

    if (event.type === ProjectPendingVersionsUpdatedMessageType.Created) {
      // Insert into model.pendingVersions
      modifyObjectFields<
        ModelPendingImportedVersionsArgs,
        Model['pendingImportedVersions']
      >(
        apollo.cache,
        getCacheId('Model', modelId),
        (fieldName, _variables, value, { ref }) => {
          if (fieldName !== 'pendingImportedVersions') return
          const currentVersions = (value || []).slice()
          currentVersions.push(ref('FileUpload', event.id))
          return uniqBy(currentVersions, (v) => v.__ref)
        }
      )
    } else if (event.type === ProjectPendingVersionsUpdatedMessageType.Updated) {
      const success =
        event.version.convertedStatus === FileUploadConvertedStatus.Completed
      const failure = event.version.convertedStatus === FileUploadConvertedStatus.Error

      if (success) {
        // Remove from model.pendingVersions
        modifyObjectFields<
          ModelPendingImportedVersionsArgs,
          Model['pendingImportedVersions']
        >(
          apollo.cache,
          getCacheId('Model', modelId),
          (fieldName, _variables, value, { ref }) => {
            if (fieldName !== 'pendingImportedVersions') return
            if (!value?.length) return
            const currentVersions = (value || []).filter(
              (i) => i.__ref !== ref('FileUpload', event.id).__ref
            )
            return currentVersions
          }
        )
      } else if (failure) {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'File import failed',
          description:
            event.version.convertedMessage ||
            `${event.version.modelName} version could not be imported`
        })
      }
    }

    handler?.(event, apollo.cache)
  })
}
