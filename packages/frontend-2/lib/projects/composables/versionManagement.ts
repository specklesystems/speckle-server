import type { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useQuery, useSubscription } from '@vue/apollo-composable'
import type { MaybeRef } from '@vueuse/core'
import type { Get } from 'type-fest'
import { SpeckleViewer } from '@speckle/shared'
import type { Nullable } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type {
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
  ProjectVersionsArgs,
  UpdateVersionInput
} from '~~/lib/common/generated/gql/graphql'
import {
  ProjectPendingVersionsUpdatedMessageType,
  ProjectVersionsUpdatedMessageType
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
import { intersection, isUndefined, uniqBy } from 'lodash-es'
import { FileUploadConvertedStatus } from '~~/lib/core/api/fileImport'
import { useLock } from '~~/lib/common/composables/singleton'

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

  const { hasLock } = useLock(
    computed(() => `useProjectVersionUpdateTracking-${unref(projectId)}`)
  )
  const isEnabled = computed(() => !!(hasLock.value || handler))
  const { onResult: onProjectVersionsUpdate } = useSubscription(
    onProjectVersionsUpdateSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )

  // Cache updates that should only be invoked once
  onProjectVersionsUpdate((res) => {
    if (!res.data?.projectVersionsUpdated || !hasLock.value) return

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
        (_fieldName, variables, value, { ref }) => {
          if (variables.filter?.search) return

          const limit = variables.limit
          const newModelRef = ref('Model', version.model.id)
          const newItems = (value?.items || []).slice()

          let itemAdded = false
          if (
            !newItems.find((i) => i.__ref === newModelRef.__ref) &&
            (isUndefined(limit) || newItems.length < limit)
          ) {
            newItems.unshift(newModelRef)
            itemAdded = true
          }

          return {
            ...(value || {}),
            items: newItems,
            totalCount: (value.totalCount || 0) + (itemAdded ? 1 : 0)
          }
        },
        { fieldNameWhitelist: ['models'] }
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
          (_fieldName, _variables, value, { readField }) => {
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
          },
          { fieldNameWhitelist: ['pendingImportedVersions'] }
        )

        // Add to model.versions
        modifyObjectFields<ModelVersionsArgs, Model['versions']>(
          apollo.cache,
          getCacheId('Model', version.model.id),
          (_fieldName, variables, value, { ref }) => {
            if (
              variables.filter?.priorityIdsOnly &&
              variables.filter?.priorityIds &&
              !variables.filter.priorityIds.includes(version.id)
            ) {
              return
            }

            const limit = variables.limit
            if (!limit) {
              return // already updated through ProjectPageLatestItemsModelItem fragment in response
            }

            const newItems = (value?.items || []).slice()

            if (isUndefined(limit) || newItems.length < limit) {
              newItems.unshift(ref('Version', version.id))
            }

            return {
              ...(value || {}),
              items: newItems,
              totalCount: (value.totalCount || 0) + 1
            }
          },
          { fieldNameWhitelist: ['versions'] }
        )

        // Add to project.versions
        modifyObjectFields<ProjectVersionsArgs, Project['versions']>(
          apollo.cache,
          getCacheId('Project', unref(projectId)),
          (_fieldName, variables, value, { ref }) => {
            const newVersionRef = ref('Version', version.id)
            const limit = variables.limit

            const newItems = (value?.items || []).slice()
            if (
              !newItems.find((i) => i.__ref === newVersionRef.__ref) &&
              (isUndefined(limit) || newItems.length < limit)
            ) {
              newItems.unshift(newVersionRef)
            }

            return {
              ...(value || {}),
              items: newItems,
              totalCount: (value.totalCount || 0) + 1
            }
          },
          { fieldNameWhitelist: ['versions'] }
        )

        // Potentially remove item from Project.pendingImportedModels?
        // Remove from pending models?
        modifyObjectFields<
          ProjectPendingImportedModelsArgs,
          Project['pendingImportedModels']
        >(
          apollo.cache,
          getCacheId('Project', unref(projectId)),
          (_fieldName, _variables, value, { readField }) => {
            if (!value?.length) return

            const versionModelName = version.model.name
            const currentModels = (value || []).filter((i) => {
              const itemModelName = readField('modelName', i)
              return itemModelName !== versionModelName
            })
            return currentModels
          },
          { fieldNameWhitelist: ['pendingImportedModels'] }
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
  })

  onProjectVersionsUpdate((res) => {
    if (!res.data?.projectVersionsUpdated) return

    const event = res.data.projectVersionsUpdated
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
          modifyObjectFields<ProjectVersionsArgs, Project['versions']>(
            cache,
            getCacheId('Project', input.projectId),
            (_fieldName, _variables, data) => {
              return {
                ...data,
                ...(!isUndefined(data.totalCount)
                  ? {
                      totalCount: Math.max(data.totalCount - input.versionIds.length, 0)
                    }
                  : {})
              }
            },
            { fieldNameWhitelist: ['versions'] }
          )

          // Update totalCounts in model
          if (options?.modelId) {
            modifyObjectFields<ModelVersionsArgs, Model['versions']>(
              cache,
              getCacheId('Model', options.modelId),
              (_fieldName, variables, data) => {
                let removedCount = input.versionIds.length
                if (
                  variables.filter?.priorityIdsOnly &&
                  variables.filter?.priorityIds
                ) {
                  const idIntersection = intersection(
                    variables.filter.priorityIds,
                    input.versionIds
                  )
                  if (idIntersection.length < 1) return
                  removedCount = idIntersection.length
                }

                return {
                  ...data,
                  ...(!isUndefined(data.totalCount)
                    ? {
                        totalCount: Math.max(data.totalCount - removedCount, 0)
                      }
                    : {})
                }
              },
              { fieldNameWhitelist: ['versions'] }
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
            (_fieldName, variables) => {
              if (!input.versionIds.includes(variables.id)) return

              // Set to null
              return null
            },
            { fieldNameWhitelist: ['version'] }
          )

          // Remove from Model.versions
          modifyObjectFields<ModelVersionsArgs, Model['versions']>(
            cache,
            getCacheId('Model', previousModelId),
            (_fieldName, _variables, data) => {
              const oldItems = data.items || []
              const newItems = oldItems.filter(
                (i) =>
                  !input.versionIds
                    .map((id) => getCacheId('Version', id))
                    .includes(i.__ref)
              )
              const removedItemsCount = Math.max(0, oldItems.length - newItems.length)

              return {
                ...data,
                ...(data.items ? { items: newItems } : {}),
                ...(!isUndefined(data.totalCount)
                  ? {
                      totalCount: data.totalCount - removedItemsCount
                    }
                  : {})
              }
            },
            { fieldNameWhitelist: ['versions'] }
          )

          // Add to new model's Model.version
          modifyObjectFields<ModelVersionArgs>(
            cache,
            getCacheId('Model', newModelId),
            (_fieldName, variables) => {
              if (!input.versionIds.includes(variables.id)) return
              return getObjectReference('Version', variables.id)
            },
            { fieldNameWhitelist: ['version'] }
          )

          // Add to new model's Model.versions
          modifyObjectFields<ModelVersionsArgs, Model['versions']>(
            cache,
            getCacheId('Model', newModelId),
            (_fieldName, _variables, data) => {
              const oldItems = data.items || []
              const newItems = [
                ...input.versionIds.map((i) => getObjectReference('Version', i)),
                ...oldItems
              ]
              const addedItemAmount = newItems.length - oldItems.length

              return {
                ...data,
                ...(data.items ? { items: newItems } : {}),
                ...(!isUndefined(data.totalCount)
                  ? {
                      totalCount: data.totalCount + addedItemAmount
                    }
                  : {})
              }
            },
            { fieldNameWhitelist: ['versions'] }
          )

          if (options?.newModelCreated) {
            evictProjectModels(input.projectId)
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

export function useProjectPendingVersionUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<
      Get<OnProjectPendingVersionsUpdatedSubscription, 'projectPendingVersionsUpdated'>
    >,
    cache: ApolloCache<unknown>
  ) => void
) {
  const { hasLock } = useLock(
    computed(() => `useProjectPendingVersionUpdateTracking-${unref(projectId)}`)
  )
  const isEnabled = computed(() => !!(hasLock.value || handler))
  const { onResult: onProjectPendingVersionsUpdate } = useSubscription(
    onProjectPendingVersionsUpdatedSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )

  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  onProjectPendingVersionsUpdate((res) => {
    if (!res.data?.projectPendingVersionsUpdated.id || !hasLock.value) return

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
        (_fieldName, _variables, value, { ref }) => {
          const currentVersions = (value || []).slice()
          currentVersions.push(ref('FileUpload', event.id))
          return uniqBy(currentVersions, (v) => v.__ref)
        },
        { fieldNameWhitelist: ['pendingImportedVersions'] }
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
          (_fieldName, _variables, value, { ref }) => {
            if (!value?.length) return
            const currentVersions = (value || []).filter(
              (i) => i.__ref !== ref('FileUpload', event.id).__ref
            )
            return currentVersions
          },
          { fieldNameWhitelist: ['pendingImportedVersions'] }
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
  })

  onProjectPendingVersionsUpdate((res) => {
    if (!res.data?.projectPendingVersionsUpdated.id) return

    const event = res.data.projectPendingVersionsUpdated
    handler?.(event, apollo.cache)
  })
}
