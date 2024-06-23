import { defineStore } from 'pinia'
import type { ApolloLink } from '@apollo/client/core'
import { ApolloClient, InMemoryCache, gql, HttpLink, split } from '@apollo/client/core'
import { ApolloClients, provideApolloClients } from '@vue/apollo-composable'
import type { Account } from '~/lib/bindings/definitions/IAccountBinding'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'

export type DUIAccount = {
  /** account info coming from the host app */
  accountInfo: Account
  /** the graphql client; a bit superflous */
  client: ApolloClient<unknown>
  /** whether an intial serverinfo query succeeded. */
  isValid: boolean
}

const accountTestQuery = gql`
  query AcccountTestQuery {
    serverInfo {
      version
      name
      company
    }
  }
`

export const useAccountStore = defineStore('accountStore', () => {
  const app = useNuxtApp()
  const { $accountBinding } = app

  const apolloClients = {} as Record<string, ApolloClient<unknown>>
  const accounts = ref<DUIAccount[]>([])
  const isLoading = ref(false)

  const defaultAccount = computed(
    () => accounts.value.find((acc) => acc.accountInfo.isDefault) as DUIAccount
  )

  const userSelectedAccount = ref<DUIAccount>()

  /**
   * Returns either the default account or the last account the user has selected.
   */
  const activeAccount = computed(() => {
    return userSelectedAccount.value || defaultAccount.value
  })

  const testAccounts = async () => {
    isLoading.value = true

    for (const acc of accounts.value) {
      if (!acc.client) continue
      if (!acc.accountInfo.serverInfo.frontend2) continue
      try {
        await acc.client.query({ query: accountTestQuery })
        acc.isValid = true
      } catch (error) {
        // TODO: properly dispose and kill this client. It's unclear how to do it.
        acc.isValid = false
        // NOTE: we do not want to delete the client, as we might want to "refresh" in
        // case the user was not connected to the interweb.
        // acc.client.disableNetworkFetches = true
        // acc.client.stop()
        // delete acc.client
      }
    }
    isLoading.value = false
  }

  const refreshAccounts = async () => {
    isLoading.value = true
    const accs = await $accountBinding.getAccounts()
    const newAccs: DUIAccount[] = []

    for (const acc of accs) {
      const existing = accounts.value.find((a) => a.accountInfo.id === acc.id)
      if (existing) {
        newAccs.push(existing as DUIAccount)
        continue
      }

      const link = splitLink(
        getLinks(new URL('/graphql', acc.serverInfo.url).href, 'Bearer ' + acc.token)
      )
      const client = new ApolloClient({
        cache: new InMemoryCache(),
        link,
        headers: {
          Authorization: 'Bearer ' + acc.token
        }
      })

      apolloClients[acc.id] = client
      newAccs.push({
        accountInfo: acc,
        client,
        isValid: true
      })
    }

    accounts.value = newAccs
    isLoading.value = false
  }

  const getLinks = (serverUrl: string, token: string) => {
    const authHeaderValue = token
    const httpLink = new HttpLink({
      uri: serverUrl
    })

    const authLink = setContext((_, { headers }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { headers: { ...headers, Authorization: authHeaderValue } }
    })

    const link = authLink.concat(httpLink as unknown as ApolloLink)

    const wsLink = new WebSocketLink({
      uri: serverUrl.replace('http', 'ws'),
      options: {
        reconnect: true,
        connectionParams: {
          Authorization: authHeaderValue
        }
      }
    })
    return { httpLink: link, wsLink }
  }

  const splitLink = ({
    httpLink,
    wsLink
  }: {
    httpLink: ApolloLink
    wsLink: WebSocketLink
  }) =>
    split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        )
      },
      wsLink,
      httpLink
    )

  const provideClients = () => {
    provideApolloClients(apolloClients)
  }

  watch(accounts, () => {
    void testAccounts()
  })

  app.vueApp.provide(ApolloClients, apolloClients)
  return {
    isLoading,
    accounts,
    defaultAccount,
    activeAccount,
    userSelectedAccount,
    refreshAccounts,
    provideClients
  }
})
