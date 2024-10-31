import { useMutation } from '@vue/apollo-composable'
import type { CreateNewRegionMutationVariables } from '~/lib/common/generated/gql/graphql'
import { modifyObjectField, ROOT_QUERY } from '~/lib/common/helpers/graphql'
import { createNewRegionMutation } from '~/lib/multiregion/graphql/mutations'

export const useCreateRegion = () => {
  const { mutate } = useMutation(createNewRegionMutation)
  const { activeUser, isAdmin } = useActiveUser()
  const { triggerNotification } = useGlobalToast()

  return async (input: CreateNewRegionMutationVariables) => {
    if (!activeUser.value || !isAdmin.value) return

    const res = await mutate(input, {
      update: (cache, { data }) => {
        const newRegion = data?.serverInfoMutations.multiRegion.create
        if (!newRegion) return

        // Add to admin region list
        modifyObjectField(
          cache,
          ROOT_QUERY,
          'serverInfo',
          ({ helpers: { createUpdatedValue, ref } }) =>
            createUpdatedValue(({ update }) => {
              update('multiRegion.regions', (regions) => [
                ref('ServerRegionItem', newRegion.id),
                ...regions
              ])
            })
        )
      }
    }).catch(convertThrowIntoFetchResult)

    if (res?.data?.serverInfoMutations.multiRegion.create.id) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Region successfully created'
      })
    } else {
      const errMsg = getFirstGqlErrorMessage(res?.errors)
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Failed to create region',
        description: errMsg
      })
    }

    return res?.data?.serverInfoMutations.multiRegion.create
  }
}
