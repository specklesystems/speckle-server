import type { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { useClipboard } from '@vueuse/core'
import type { MaybeRef } from '@vueuse/core'
import type { Get } from 'type-fest'
import type { GenericValidateFunction } from 'vee-validate'
import { SpeckleViewer } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type {
  DeleteModelInput,
  OnProjectModelsUpdateSubscription,
  OnProjectPendingModelsUpdatedSubscription,
  Project,
  ProjectModelsArgs,
  ProjectModelsTreeArgs,
  ProjectPendingImportedModelsArgs,
  UpdateModelInput
} from '~~/lib/common/generated/gql/graphql'
import {
  ProjectModelsUpdatedMessageType,
  ProjectPendingModelsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import {
  createModelMutation,
  deleteModelMutation,
  updateModelMutation
} from '~~/lib/projects/graphql/mutations'
import {
  onProjectModelsUpdateSubscription,
  onProjectPendingModelsUpdatedSubscription
} from '~~/lib/projects/graphql/subscriptions'
import { modelRoute, useNavigateToProject } from '~~/lib/common/helpers/route'
import { FileUploadConvertedStatus } from '~~/lib/core/api/fileImport'
import { useLock } from '~~/lib/common/composables/singleton'
import { isUndefined } from 'lodash-es'

const isValidModelName: GenericValidateFunction<string> = (name) => {
  name = name.trim()
  if (
    name.startsWith('/') ||
    name.endsWith('/') ||
    name.startsWith('#') ||
    name.startsWith('$') ||
    name.indexOf('//') !== -1 ||
    name.indexOf(',') !== -1
  )
    return 'Value should not start with "#", "$", start or end with "/", have multiple slashes next to each other or contain commas'

  if (['globals', 'main'].includes(name))
    return `'main' and 'globals' are reserved names`

  return true
}

export function useModelNameValidationRules() {
  return computed(() => [
    isRequired,
    isStringOfLength({ maxLength: 512 }),
    isValidModelName
  ])
}

export function useEvictProjectModelFields() {
  const apollo = useApolloClient().client
  const cache = apollo.cache
  return (projectId: string) => {
    // Manual cache updates when new models are created are too overwhelming, there's multiple places in the graph
    // where you can find a model, some of which order models in a tree structure
    // so we're just evicting all Project model related fields
    evictObjectFields(cache, getCacheId('Project', projectId), (field) => {
      return [
        'models',
        'modelsTree',
        'model',
        'modelChildrenTree',
        'viewerResources'
      ].includes(field)
    })
  }
}

export function useCreateNewModel() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const evictProjectModels = useEvictProjectModelFields()

  return async (values: { name: string; description: string; projectId: string }) => {
    const { name, description, projectId } = values

    const { data, errors } = await apollo
      .mutate({
        mutation: createModelMutation,
        variables: {
          input: {
            name,
            description,
            projectId
          }
        },
        update: (_cache, { data }) => {
          if (!data?.modelMutations?.create?.id) return
          evictProjectModels(projectId)
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.modelMutations?.create?.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'New model created'
      })
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Model creation failed',
        description: errMsg
      })
    }

    return data?.modelMutations?.create
  }
}

export function useUpdateModel() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  return async (input: UpdateModelInput) => {
    const { data, errors } = await apollo
      .mutate({
        mutation: updateModelMutation,
        variables: {
          input
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.modelMutations.update.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Model updated'
      })
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Model update failed',
        description: errMsg
      })
    }

    return data?.modelMutations.update
  }
}

export function useDeleteModel() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const evictProjectModels = useEvictProjectModelFields()

  return async (input: DeleteModelInput) => {
    const { data, errors } = await apollo
      .mutate({
        mutation: deleteModelMutation,
        variables: {
          input
        },
        update: (cache, res) => {
          if (!res.data?.modelMutations.delete) return

          cache.evict({
            id: getCacheId('Model', input.id)
          })
          evictProjectModels(input.projectId)
        }
      })
      .catch(convertThrowIntoFetchResult)

    if (data?.modelMutations.delete) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Model deleted'
      })
    } else {
      const errMsg = getFirstErrorMessage(errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Model delete failed',
        description: errMsg
      })
    }

    return !!data?.modelMutations.delete
  }
}

/**
 * Track project model updates/deletes and make cache updates accordingly. Optionally
 * provide an extra handler that you can use to react to all model update events (create/update/delete)
 */
export function useProjectModelUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<Get<OnProjectModelsUpdateSubscription, 'projectModelsUpdated'>>,
    cache: ApolloCache<unknown>
  ) => void,
  options?: Partial<{ redirectToProjectOnModelDeletion: (modelId: string) => boolean }>
) {
  const { hasLock } = useLock(
    computed(() => `useProjectModelUpdateTracking-${unref(projectId)}`)
  )
  const isEnabled = computed(() => !!(hasLock.value || handler))
  const { onResult: onProjectModelUpdate } = useSubscription(
    onProjectModelsUpdateSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )

  const apollo = useApolloClient().client
  const evictProjectModels = useEvictProjectModelFields()
  const goToProject = useNavigateToProject()
  const { triggerNotification } = useGlobalToast()

  onProjectModelUpdate((res) => {
    if (!res.data?.projectModelsUpdated || !hasLock.value) return

    // If model was updated, apollo already updated it
    const event = res.data.projectModelsUpdated
    const isDelete = event.type === ProjectModelsUpdatedMessageType.Deleted
    const model = event.model

    if (isDelete) {
      // Evict from cache
      apollo.cache.evict({
        id: getCacheId('Model', event.id)
      })

      if (options?.redirectToProjectOnModelDeletion?.(event.id)) {
        goToProject({ id: unref(projectId) })

        triggerNotification({
          type: ToastNotificationType.Info,
          title: 'Model has been deleted',
          description: 'Redirecting to project page home'
        })
      }
    }

    // If creation or deletion, refresh all project's model fields
    if (event.type === ProjectModelsUpdatedMessageType.Created || isDelete) {
      evictProjectModels(unref(projectId))
    } else if (
      event.type === ProjectModelsUpdatedMessageType.Updated &&
      model?.versionCount.totalCount
    ) {
      // Updated model that has versions - it might not have had them previously,
      // so add it to the relevant model list
      modifyObjectFields<ProjectModelsArgs, Project['models']>(
        apollo.cache,
        getCacheId('Project', unref(projectId)),
        (_fieldName, variables, value, { ref }) => {
          if (variables.filter?.search) return
          if (variables.filter?.sourceApps?.length) return
          if (variables.filter?.contributors?.length) return
          if (!variables.filter?.onlyWithVersions) return

          const limit = variables.limit
          const newModelRef = ref('Model', model.id)
          const newItems = (value?.items || []).slice()

          if (
            !newItems.find((i) => i.__ref === newModelRef.__ref) &&
            (isUndefined(limit) || newItems.length < limit)
          ) {
            newItems.unshift(newModelRef)
          }

          return {
            ...(value || {}),
            items: newItems,
            totalCount: (value.totalCount || 0) + 1
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
            if (fullName === model.name) return false
          }

          return true
        }
      )
    }
  })

  onProjectModelUpdate((res) => {
    if (!res.data?.projectModelsUpdated) return
    const event = res.data.projectModelsUpdated
    handler?.(event, apollo.cache)
  })
}

export function useProjectPendingModelUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<
      Get<OnProjectPendingModelsUpdatedSubscription, 'projectPendingModelsUpdated'>
    >,
    cache: ApolloCache<unknown>
  ) => void
) {
  const { hasLock } = useLock(
    computed(() => `useProjectPendingModelUpdateTracking-${unref(projectId)}`)
  )
  const isEnabled = computed(() => !!(hasLock.value || handler))

  const { onResult: onProjectPendingModelUpdate } = useSubscription(
    onProjectPendingModelsUpdatedSubscription,
    () => ({
      id: unref(projectId)
    }),
    { enabled: isEnabled }
  )
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

  onProjectPendingModelUpdate((res) => {
    if (!res.data?.projectPendingModelsUpdated.id || !hasLock.value) return
    const event = res.data.projectPendingModelsUpdated

    if (event.type === ProjectPendingModelsUpdatedMessageType.Created) {
      // Insert into project.pendingModels
      modifyObjectFields<
        ProjectPendingImportedModelsArgs,
        Project['pendingImportedModels']
      >(
        apollo.cache,
        getCacheId('Project', unref(projectId)),
        (_fieldName, _variables, value, { ref }) => {
          const currentModels = (value || []).slice()
          currentModels.push(ref('FileUpload', event.id))
          return currentModels
        },
        { fieldNameWhitelist: ['pendingImportedModels'] }
      )
    } else if (event.type === ProjectPendingModelsUpdatedMessageType.Updated) {
      // If converted emit toast notification & remove from pending models
      // (if it still exists there, cause "version create" subscription might've already removed it)
      const success =
        event.model.convertedStatus === FileUploadConvertedStatus.Completed
      const failure = event.model.convertedStatus === FileUploadConvertedStatus.Error
      const newModel = event.model.model

      if (success && newModel) {
        modifyObjectFields<
          ProjectPendingImportedModelsArgs,
          Project['pendingImportedModels']
        >(
          apollo.cache,
          getCacheId('Project', unref(projectId)),
          (_fieldName, _variables, value, { ref }) => {
            if (!value?.length) return

            const currentModels = (value || []).filter(
              (i) => i.__ref !== ref('FileUpload', event.id).__ref
            )
            return currentModels
          },
          { fieldNameWhitelist: ['pendingImportedModels'] }
        )
      } else if (failure) {
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'File import failed',
          description:
            event.model.convertedMessage ||
            `${event.model.modelName} could not be imported`
        })
      }
    }
  })

  onProjectPendingModelUpdate((res) => {
    if (!res.data?.projectPendingModelsUpdated.id) return
    const event = res.data.projectPendingModelsUpdated
    handler?.(event, apollo.cache)
  })
}

export function useCopyModelLink() {
  const { copy } = useClipboard()
  const { triggerNotification } = useGlobalToast()

  return async (projectId: string, modelId: string, versionId?: string) => {
    if (import.meta.server) {
      throw new Error('Not supported in SSR')
    }

    const path = modelRoute(
      projectId,
      SpeckleViewer.ViewerRoute.resourceBuilder()
        .addModel(modelId, versionId)
        .toString()
    )
    const url = new URL(path, window.location.toString()).toString()

    await copy(url)
    triggerNotification({
      type: ToastNotificationType.Info,
      title: `Copied ${versionId ? 'version' : 'model'} link to clipboard`
    })
  }
}
