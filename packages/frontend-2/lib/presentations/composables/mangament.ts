import { useMutation } from '@vue/apollo-composable'
import type { UpdateSavedViewInput } from '~/lib/common/generated/gql/graphql'
import { updatePresentationSlideMutation } from '~/lib/presentations/graphql/mutations'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export const useUpdatePresentationSlide = () => {
  const { mutate, loading } = useMutation(updatePresentationSlideMutation)
  const mixpanel = useMixpanel()

  return {
    mutate: async (params: {
      input: UpdateSavedViewInput
      workspaceId: MaybeNullOrUndefined<string>
    }) => {
      const { input, workspaceId } = params
      const result = await mutate({ input })

      if (result?.data?.projectMutations.savedViewMutations.updateView) {
        mixpanel.track('Presentation Slide Updated', {
          // eslint-disable-next-line camelcase
          workspace_id: workspaceId
        })
      }

      return result
    },
    loading
  }
}
