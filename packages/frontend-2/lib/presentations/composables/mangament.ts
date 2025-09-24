import { useMutation } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~/lib/common/composables/toast'
import {
  convertThrowIntoFetchResult,
  getFirstErrorMessage
} from '~/lib/common/helpers/graphql'
import type { UpdateSavedViewInput } from '~/lib/common/generated/gql/graphql'
import { updatePresentationSlideMutation } from '~/lib/presentations/graphql/mutations'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export const useUpdatePresentationSlide = () => {
  const { mutate, loading } = useMutation(updatePresentationSlideMutation)
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  return {
    mutate: async (params: {
      input: UpdateSavedViewInput
      workspaceId: MaybeNullOrUndefined<string>
    }) => {
      const { input, workspaceId } = params
      const result = await mutate({ input }).catch(convertThrowIntoFetchResult)

      if (result?.data?.projectMutations.savedViewMutations.updateView) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: 'Slide updated'
        })

        mixpanel.track('Presentation Slide Updated', {
          // eslint-disable-next-line camelcase
          workspace_id: workspaceId
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
