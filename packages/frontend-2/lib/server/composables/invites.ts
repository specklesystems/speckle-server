import { useMutation } from '@vue/apollo-composable'
import { isArray } from 'lodash'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import type {
  AdminInviteList,
  ServerInviteCreateInput
} from '~~/lib/common/generated/gql/graphql'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { inviteServerUserMutation } from '../graphql/mutations'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useUserSearch } from '~/lib/common/composables/users'
import { isValidEmail } from '~/lib/workspaces/helpers/invites'
import { uniq } from 'lodash-es'

export function useInviteUserToServer() {
  const { triggerNotification } = useGlobalToast()
  const { mutate, loading } = useMutation(inviteServerUserMutation)

  return {
    mutate: async (input: ServerInviteCreateInput | ServerInviteCreateInput[]) => {
      const finalInput = isArray(input) ? input : [input]
      const res = await mutate(
        {
          input: finalInput
        },
        {
          update: (cache, { data }) => {
            if (data?.serverInviteBatchCreate) {
              modifyObjectFields<undefined, { [key: string]: AdminInviteList }>(
                cache,
                ROOT_QUERY,
                (fieldName, _variables, value, details) => {
                  const inviteListFields = Object.keys(value).filter(
                    (k) =>
                      details.revolveFieldNameAndVariables(k).fieldName === 'inviteList'
                  )
                  const newVal: typeof value = { ...value }
                  for (const field of inviteListFields) {
                    delete newVal[field]
                  }
                  return newVal
                },
                { fieldNameWhitelist: ['admin'] }
              )
            }
          }
        }
      ).catch(convertThrowIntoFetchResult)

      if (res?.data?.serverInviteBatchCreate) {
        triggerNotification({
          type: ToastNotificationType.Success,
          title: `Server invite${finalInput.length > 1 ? 's' : ''} sent`
        })
      } else {
        const errMsg = getFirstErrorMessage(res?.errors)
        triggerNotification({
          type: ToastNotificationType.Danger,
          title: `Couldn't send invite${finalInput.length > 1 ? 's' : ''}`,
          description: errMsg
        })
      }

      return !!res?.data?.serverInviteBatchCreate
    },
    loading
  }
}

export const useResolveInviteTargets = (params: {
  search: Ref<MaybeNullOrUndefined<string>>
  /**
   * For excluding already invited/added users from search results.
   */
  excludeUserIds?: Ref<MaybeNullOrUndefined<string[]>>
  excludeEmails?: Ref<MaybeNullOrUndefined<string[]>>
  /**
   * Used for searching of users within a workspace context
   */
  workspaceId?: MaybeNullOrUndefined<string>
}) => {
  const { search, excludeUserIds, excludeEmails, workspaceId } = params

  const { userSearch, searchVariables, loading } = useUserSearch({
    variables: computed(() => ({
      query: search.value || '',
      limit: 5,
      workspaceId
    }))
  })

  const emails = computed(() => {
    if (loading.value) return []

    const query = searchVariables.value?.query || ''
    const multipleEmails = isValidEmail(query)
      ? [query]
      : query.split(',').map((i) => i.trim())
    const validEmails = multipleEmails.filter((e) => isValidEmail(e))
    const uniqueEmails = uniq(validEmails)

    const finalEmails = uniqueEmails.length ? uniqueEmails : []
    const invitedEmails = new Set(excludeEmails?.value || [])
    if (!invitedEmails.size) return finalEmails

    return finalEmails.filter((e) => !invitedEmails.has(e))
  })

  const users = computed(() => {
    const searchResults = userSearch.value?.userSearch.items || []
    const collaboratorIds = new Set(excludeUserIds?.value || [])
    if (!collaboratorIds.size) return searchResults

    return searchResults.filter((r) => !collaboratorIds.has(r.id))
  })

  const hasTargets = computed(() => users.value?.length || emails.value?.length)

  return { users, emails, hasTargets }
}
