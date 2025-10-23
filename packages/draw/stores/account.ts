import { defineStore } from 'pinia'
import type { ApolloLink } from '@apollo/client/core'
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  from,
  gql
} from '@apollo/client/core'
import { WebSocketLink } from '@apollo/client/link/ws'
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { getToken } from '~/lib/authn/useAuthManager'
import { DefaultApolloClient, provideApolloClients } from '@vue/apollo-composable'

export type Account = {
  name: string
  email: string
  avatar?: string
}

export type DashboardAccount = {
  /** account info coming from the host app */
  account: Account
  /** the graphql client; a bit superflous */
  client: ApolloClient<unknown>
}

export const useAccountStore = defineStore('account', () => {
  const app = useNuxtApp()

  const isLoading = ref(false)
  const client = ref<ApolloClient<unknown> | null>(null)
  const account = ref<DashboardAccount | null>(null)

  const getLinks = (serverUrl: string, token: string) => {
    const httpLink = new HttpLink({ uri: serverUrl })
    const authLink = setContext((_, { headers }) => ({
      headers: { ...headers, Authorization: token }
    }))
    const link = authLink.concat(httpLink as unknown as ApolloLink)

    const wsLink = new WebSocketLink({
      uri: serverUrl.replace('http', 'ws'),
      options: {
        reconnect: true,
        connectionParams: { Authorization: token }
      }
    })
    return { httpLink: link, wsLink }
  }

  const splitLink = (httpLink: ApolloLink, wsLink: ApolloLink) =>
    split(
      ({ query }) => {
        const def = getMainDefinition(query)
        return def.kind === 'OperationDefinition' && def.operation === 'subscription'
      },
      wsLink,
      httpLink
    )

  const initClient = async (serverUrl = 'https://app.speckle.systems/graphql') => {
    const token = getToken()
    if (!token) return null

    const { httpLink, wsLink } = getLinks(serverUrl, 'Bearer ' + token)
    const link = splitLink(httpLink, wsLink)

    const apolloClient = new ApolloClient({
      link: from([link]),
      cache: new InMemoryCache(),
      defaultOptions: {
        query: { errorPolicy: 'all' },
        mutate: { errorPolicy: 'all' },
        watchQuery: { errorPolicy: 'all' }
      }
    })

    client.value = apolloClient

    provideApolloClients({
      default: apolloClient
    })

    const accountTestQuery = gql`
      query AcccountTestQuery {
        activeUser {
          email
          name
          avatar
        }
      }
    `

    try {
      const res = await client.value.query({ query: accountTestQuery })

      account.value = {
        client: client as unknown as ApolloClient<unknown>,
        account: {
          name: res.data?.activeUser.name,
          avatar: res.data?.activeUser.avatar,
          email: res.data.activeUser.email
        }
      } as DashboardAccount
    } catch (error) {
      console.log(error)
      account.value = null // Set account to null on error
    } finally {
      isLoading.value = false // Always set loading to false when done
    }
  }

  initClient()

  app.vueApp.provide(DefaultApolloClient, unref(client))

  return { isLoading, account, initClient }
})
