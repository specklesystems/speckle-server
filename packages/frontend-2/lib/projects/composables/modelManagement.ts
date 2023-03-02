import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef, useClipboard } from '@vueuse/core'
import { Get } from 'type-fest'
import { GenericValidateFunction } from 'vee-validate'
import { SpeckleViewer } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  DeleteModelInput,
  OnProjectModelsUpdateSubscription,
  ProjectModelsUpdatedMessageType,
  UpdateModelInput
} from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import {
  createModelMutation,
  deleteModelMutation,
  updateModelMutation
} from '~~/lib/projects/graphql/mutations'
import { onProjectModelsUpdateSubscription } from '~~/lib/projects/graphql/subscriptions'
import { modelRoute } from '~~/lib/common/helpers/route'

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
      return ['models', 'modelsTree', 'model', 'modelChildrenTree'].includes(field)
    })
  }
}

export function useCreateNewModel() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()
  const evictProjectModels = useEvictProjectModelFields()

  return async (values: { name: string; projectId: string }) => {
    const { name, projectId } = values

    const { data, errors } = await apollo
      .mutate({
        mutation: createModelMutation,
        variables: {
          input: {
            name,
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
 *
 *
 * Note: Only invoke this once per project per page, because it handles all kinds of cache updates
 * that we don't want to duplicate (or extract that part out into a separate composable)
 */
export function useProjectModelUpdateTracking(
  projectId: MaybeRef<string>,
  handler?: (
    data: NonNullable<Get<OnProjectModelsUpdateSubscription, 'projectModelsUpdated'>>,
    cache: ApolloCache<unknown>
  ) => void
) {
  const { onResult: onProjectModelUpdate } = useSubscription(
    onProjectModelsUpdateSubscription,
    () => ({
      id: unref(projectId)
    })
  )
  const apollo = useApolloClient().client

  onProjectModelUpdate((res) => {
    if (!res.data?.projectModelsUpdated) return

    // If model was updated, apollo already updated it
    const event = res.data.projectModelsUpdated
    const isDelete = event.type === ProjectModelsUpdatedMessageType.Deleted

    if (isDelete) {
      // Evict from cache
      apollo.cache.evict({
        id: getCacheId('Model', event.id)
      })
    }

    handler?.(event, apollo.cache)
  })
}

export function useCopyModelLink() {
  const { copy } = useClipboard()
  const { triggerNotification } = useGlobalToast()

  return async (projectId: string, modelId: string) => {
    if (process.server) {
      throw new Error('Not supported in SSR')
    }

    const path = modelRoute(
      projectId,
      SpeckleViewer.ViewerRoute.resourceBuilder().addModel(modelId).toString()
    )
    const url = new URL(path, window.location.toString()).toString()

    await copy(url)
    triggerNotification({
      type: ToastNotificationType.Info,
      title: 'Copied model link to clipboard'
    })
  }
}
