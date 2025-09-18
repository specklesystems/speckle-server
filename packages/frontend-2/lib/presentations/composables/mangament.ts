import { useMutation } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'
import type { UpdateSavedViewInput } from '~/lib/common/generated/gql/graphql'
import { updatePresentationSlideMutation } from '~/lib/presentations/graphql/mutations'

export const useUpdatePresentationSlide = () => {
  const { mutate, loading } = useMutation(updatePresentationSlideMutation)
  const { triggerNotification } = useGlobalToast()

  return {
    mutate: async (input: UpdateSavedViewInput) => {
      const result = await mutate({ input }).catch(convertThrowIntoFetchResult)

      if (result?.data?.projectMutations.savedViewMutations.updateView) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Slide updated'
        })
      } else {
        const errorMessage = getFirstErrorMessage(result?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: 'Slide update failed',
          description: errorMessage
        })
      }

      return result
    },
    loading
  }
}
