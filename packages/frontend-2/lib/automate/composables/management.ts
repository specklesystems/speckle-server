import { useMutation } from '@vue/apollo-composable'
import {
  createAutomateFunctionMutation,
  updateAutomateFunctionMutation
} from '~/lib/automate/graphql/mutations'
import type {
  CreateAutomateFunctionMutationVariables,
  UpdateAutomateFunctionMutationVariables
} from '~/lib/common/generated/gql/graphql'
import { getFirstErrorMessage } from '~/lib/common/helpers/graphql'

// TODO: Cache updates

export const useCreateAutomateFunction = () => {
  const { mutate } = useMutation(createAutomateFunctionMutation)
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (input: CreateAutomateFunctionMutationVariables) => {
    if (!activeUser.value) return

    const res = await mutate(input, {
      // update: (cache, { data }) => {
      //   const id = data?.automateMutations.createFunction.id
      //   if (!id) return
      //   // Evict relevant automateFunction() call
      //   evictObjectFields<QueryAutomateFunctionArgs>(
      //     cache,
      //     ROOT_QUERY,
      //     (fieldName, variables) => {
      //       if (fieldName !== 'automateFunction') return false
      //       if (variables.id === id) return true
      //       return false
      //     }
      //   )
      //   // Update automateFunctions.items
      //   modifyObjectFields<QueryAutomateFunctionsArgs, AutomateFunctionCollection>(
      //     cache,
      //     ROOT_QUERY,
      //     (_fieldName, variables, value, { ref }) => {
      //       if (variables.filter?.search?.length) return
      //       if (!value?.items) return
      //       const existingItems = value.items || []
      //       const newItems: typeof existingItems = uniqBy(
      //         [ref('AutomateFunction', id), ...existingItems],
      //         (i) => i.__ref
      //       )
      //       const newItemAdded = newItems.length > existingItems.length
      //       return {
      //         ...value,
      //         ...(isNumber(value.totalCount)
      //           ? {
      //               totalCount: value.totalCount + (newItemAdded ? 1 : 0)
      //             }
      //           : {}),
      //         items: newItems.slice(0, variables.limit || newItems.length)
      //       }
      //     },
      //     { fieldNameWhitelist: ['automateFunctions'] }
      //   )
      // }
    }).catch(convertThrowIntoFetchResult)
    if (res?.data?.automateMutations.createFunction.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Function successfully created'
      })
    } else {
      const errMsg = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to create function',
        description: errMsg
      })
    }

    return res?.data?.automateMutations.createFunction
  }
}

export const useUpdateAutomateFunction = () => {
  const { mutate } = useMutation(updateAutomateFunctionMutation)
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (input: UpdateAutomateFunctionMutationVariables) => {
    if (!activeUser.value) return

    const res = await mutate(input).catch(convertThrowIntoFetchResult)
    if (res?.data?.automateMutations.updateFunction.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Function successfully updated'
      })
    } else {
      const errMsg = getFirstErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to update function',
        description: errMsg
      })
    }

    return res?.data?.automateMutations.updateFunction
  }
}
