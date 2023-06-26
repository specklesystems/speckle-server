import { ApolloClient } from '@apollo/client/core'
import { ApolloClients } from '@vue/apollo-composable'
import { resolveClientConfig } from '~/lib/core/configs/apollo'
import { Account } from '~/types/account'

type ApolloClientsType = {
  [id: string]: ApolloClient<unknown>
}

export default defineNuxtPlugin((nuxtApp) => {
  /**
   * TODO: You can use `window` here to get credentials for all of the clients
   * we need from the parent connectors. The following is just an example
   */

  const accountsString = localStorage.getItem('localAccounts')

  let apolloClients: ApolloClientsType = {}

  if (accountsString !== null) {
    const accounts: Account[] = JSON.parse(accountsString) as Account[]

    apolloClients = accounts.reduce(function (
      apolloClients: ApolloClientsType,
      account: Account
    ) {
      const fullName = account.serverInfo.name
      const name = fullName.split(' ')[1].toLowerCase()

      apolloClients[name] = new ApolloClient(
        resolveClientConfig({
          httpEndpoint: `${account.serverInfo.name}/graphql`,
          authToken: () => account.token
        })
      )
      return apolloClients
    },
    {})
  }
  // TODO: Need to figure out later what if else
  else {
    apolloClients = {
      latest: new ApolloClient(
        // Imagine endpoint & token is resolved from window or something
        resolveClientConfig({
          httpEndpoint: 'https://latest.speckle.systems/graphql',
          authToken: () => null
        })
      ),
      xyz: new ApolloClient(
        // Imagine endpoint & token is resolved from window or something
        resolveClientConfig({
          httpEndpoint: 'https://speckle.xyz/graphql',
          authToken: () => null
        })
      )
    }
  }

  nuxtApp.vueApp.provide(ApolloClients, apolloClients)
  return {
    provide: {
      apolloClients
    }
  }
})
