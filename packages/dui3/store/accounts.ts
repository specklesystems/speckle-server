import { defineStore } from 'pinia'
import type { ApolloLink } from '@apollo/client/core'
import {
  ApolloClient,
  InMemoryCache,
  gql,
  HttpLink,
  split,
  from
} from '@apollo/client/core'
import { ApolloClients, provideApolloClients } from '@vue/apollo-composable'
import type { Account } from '~/lib/bindings/definitions/IAccountBinding'
import { WebSocketLink } from '@apollo/client/link/ws'
import { onError, type ErrorResponse } from '@apollo/client/link/error'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { useHostAppStore } from '~/store/hostApp'
import type { ToastNotification } from '@speckle/ui-components'
import { ToastNotificationType } from '@speckle/ui-components'

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
  const { $accountBinding, $configBinding } = app

  const hostAppStore = useHostAppStore()

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

  const setUserSelectedAccount = (acc: DUIAccount) => {
    userSelectedAccount.value = acc
    try {
      // NOTE: for the safe merge!
      $configBinding.setUserSelectedAccountId(acc.accountInfo.id) // not need to await, fire and forget?
    } catch (error) {
      console.warn(error)
    }
  }

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

      // Handle apollo client errors as top level
      const errorLink = onError((res: ErrorResponse) => {
        if (res.graphQLErrors) {
          if (
            res.graphQLErrors?.some(
              (err) => err.extensions.code === 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR'
            )
          ) {
            hostAppStore.setNotification({
              type: ToastNotificationType.Warning,
              title: 'SSO Required',
              description:
                'Your workspace requires SSO authentication. Please sign in and try again.'
            })
          }

          // const messages: string[] = []
          // res.graphQLErrors.forEach(({ message, path }) => {
          //   messages.push(`${message},\n Path: ${path}`)
          // })

          // const notification: ToastNotification = {
          //   type: ToastNotificationType.Danger,
          //   title: 'Graphql Error',
          //   description: messages.join('\n')
          // }
          // hostAppStore.setNotification(notification)
        }

        if (res.networkError) {
          const notification: ToastNotification = {
            type: ToastNotificationType.Danger,
            title: 'Network Error',
            description: res.networkError.message
          }
          hostAppStore.setNotification(notification)
        }
      })

      const link = splitLink(
        getLinks(new URL('/graphql', acc.serverInfo.url).href, 'Bearer ' + acc.token)
      )
      const client = new ApolloClient({
        cache: new InMemoryCache(),
        link: from([errorLink, link]),
        headers: {
          Authorization: 'Bearer ' + acc.token
        },
        defaultOptions: {
          query: {
            errorPolicy: 'all'
          },
          mutate: {
            errorPolicy: 'all'
          },
          watchQuery: {
            errorPolicy: 'all'
          }
        }
      })

      // const workspacesEnabled = false
      // try {
      //   // get workspace enabled flag and store it in account
      //   const res = await client.query({ query: serverInfoQuery })
      //   workspacesEnabled = !!res.data.serverInfo.workspaces.workspacesEnabled
      // } catch (err) {
      //   // probably having some local account or client could not established well for some reason!
      //   console.log(err)
      // }

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

  const isAccountExistsById = (accountId: string) => {
    return !!accounts.value.find((acc) => acc.accountInfo.id === accountId)
  }

  const isAccountExistsByServer = (serverUrl: string) => {
    return !!accounts.value.find((acc) => acc.accountInfo.serverInfo.url === serverUrl)
  }

  const accountWithFallback = (accountId: string, serverUrl: string) => {
    const accountMatchWithId = accounts.value.find(
      (acc) => acc.accountInfo.id === accountId
    )
    if (accountMatchWithId) return accountMatchWithId
    // NOTE: we do assumption here by having first matched url.
    const accountMatchWithServerUrl = accounts.value.find(
      (acc) => acc.accountInfo.serverInfo.url === serverUrl
    )
    if (accountMatchWithServerUrl) return accountMatchWithServerUrl

    return activeAccount.value
  }

  const accountByServerUrl = (serverUrl: string) => {
    const accountMatchWithServerUrl = accounts.value.find(
      (acc) => acc.accountInfo.serverInfo.url === serverUrl
    )
    if (accountMatchWithServerUrl) return accountMatchWithServerUrl
  }

  const provideClients = () => {
    provideApolloClients(apolloClients)
  }

  watch(accounts, () => {
    void testAccounts()
  })

  const init = async () => {
    await refreshAccounts()
    try {
      const accountsConfig = await $configBinding.getUserSelectedAccountId()
      userSelectedAccount.value = accounts.value.find(
        (a) => a.accountInfo.id === accountsConfig.userSelectedAccountId
      ) as DUIAccount
    } catch (error) {
      console.warn(error)
    }
  }

  init()

  app.vueApp.provide(ApolloClients, apolloClients)
  return {
    isLoading,
    accounts,
    defaultAccount,
    activeAccount,
    userSelectedAccount,
    setUserSelectedAccount,
    accountByServerUrl,
    isAccountExistsById,
    isAccountExistsByServer,
    refreshAccounts,
    accountWithFallback,
    provideClients
  }
})
