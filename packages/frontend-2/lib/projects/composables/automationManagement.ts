import { useMutation } from '@vue/apollo-composable'
import type {
  UpdateAutomationMutation,
  UpdateAutomationMutationVariables
} from '~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'
import { updateAutomationMutation } from '~/lib/projects/graphql/mutations'

export function useUpdateAutomation() {
  const { activeUser } = useActiveUser()
  const { triggerNotification } = useGlobalToast()
  const { mutate: updateAutomation } = useMutation(updateAutomationMutation)

  return async (
    update: UpdateAutomationMutationVariables,
    options?: Partial<{
      optimisticResponse: UpdateAutomationMutation
    }>
  ) => {
    if (!activeUser.value) return

    const result = await updateAutomation(update, {
      optimisticResponse: options?.optimisticResponse
    }).catch(convertThrowIntoFetchResult)

    if (result?.data?.projectMutations.automationMutations.update?.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Automation updated'
      })
    } else {
      const errMsg = getFirstErrorMessage(result?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Automation update failed',
        description: errMsg
      })
    }

    return result?.data?.projectMutations.automationMutations.update
  }
}
