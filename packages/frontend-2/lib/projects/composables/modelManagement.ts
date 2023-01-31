import { ApolloCache } from '@apollo/client/core'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import { MaybeRef } from '@vueuse/core'
import { Get } from 'type-fest'
import { GenericValidateFunction } from 'vee-validate'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  OnProjectModelsUpdateSubscription,
  ProjectModelsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  evictObjectFields,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { isRequired } from '~~/lib/common/helpers/validation'
import { createModelMutation } from '~~/lib/projects/graphql/mutations'
import { onProjectModelsUpdateSubscription } from '~~/lib/projects/graphql/subscriptions'

const isValidModelName: GenericValidateFunction<string> = (name) => {
  if (
    name.startsWith('/') ||
    name.startsWith('#') ||
    name.startsWith('$') ||
    name.indexOf('//') !== -1 ||
    name.indexOf(',') !== -1
  )
    return 'Value should not start with "#", "/", "$", have multiple slashes next to each other or contain commas'

  return true
}

export function useModelNameValidationRules() {
  return computed(() => [
    isRequired,
    // isStringOfLength({ minLength: 3 }),
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
