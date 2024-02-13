import { ApolloClient } from '@apollo/client/core'
import {
  provideApolloClient,
  useMutation,
  useQuery,
  useSubscription
} from '@vue/apollo-composable'
import { onProjectVersionsUpdateSubscription } from '~/lib/graphql/subscriptions'
import { useAccountStore } from '~~/store/accounts'

function getValidOrDefaultAccount(
  clientId: string | undefined = undefined
): ApolloClient<unknown> {
  const { defaultAccount, accounts } = storeToRefs(useAccountStore())
  if (!clientId) return defaultAccount.value?.client as ApolloClient<unknown>
  const account = accounts.value.find((acc) => acc.accountInfo.id === clientId)
  if (account) return account.client as ApolloClient<unknown>

  throw new Error(`Failed to find a valid account for id ${clientId}`)
}

export function useProjectVersionUpdated(clientId: string | undefined = undefined) {
  return (projectId: string) => {
    const client = getValidOrDefaultAccount(clientId)
    const onProjectVersionUpdate = provideApolloClient(client)(() =>
      useSubscription(onProjectVersionsUpdateSubscription, { id: projectId })
    )
    return onProjectVersionUpdate
  }
}
