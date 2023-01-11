import { useApolloClient } from '@vue/apollo-composable'
import { GenericValidateFunction } from 'vee-validate'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { isRequired } from '~~/lib/common/helpers/validation'
import { createModelMutation } from '~~/lib/projects/graphql/mutations'

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

export function useCreateNewModel() {
  const apollo = useApolloClient().client
  const { triggerNotification } = useGlobalToast()

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
        update: (cache, { data }) => {
          if (!data?.modelMutations?.create?.id) return

          const projectGqlId = getCacheId('Project', projectId)

          // Manual cache updates are too overwhelming, there's multiple places in the graph
          // where you can find a model, some of which order models in a tree structure
          // so we're just refetching all model data instead
          cache.evict({ id: projectGqlId, fieldName: 'models' })
          cache.evict({ id: projectGqlId, fieldName: 'modelsTree' })
          cache.evict({ id: projectGqlId, fieldName: 'model' })
          cache.evict({ id: projectGqlId, fieldName: 'modelChildrenTree' })
          cache.gc()
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
