import { defineStore } from 'pinia'
import { ApolloClient, gql } from '@apollo/client/core'
import { ApolloClients } from '@vue/apollo-composable'
import { resolveClientConfig } from '~/lib/core/configs/apollo'
import { Account } from '~/lib/bindings/definitions/IAccountBinding'

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

  const defaultAccount = computed(() =>
    accounts.value.find((acc) => acc.accountInfo.isDefault)
  )

  const testAccounts = async () => {
    isLoading.value = true

    for (const acc of accounts.value) {
      if (!acc.client) continue
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
      console.log(acc.serverInfo.url)

      console.log(new URL('/graphql', acc.serverInfo.url))

      const client = new ApolloClient(
        resolveClientConfig({
          httpEndpoint: new URL('/graphql', acc.serverInfo.url).href,
          authToken: () => acc.token
        })
      )
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

  watch(accounts, () => {
    void testAccounts()
  })

  void refreshAccounts()

  app.vueApp.provide(ApolloClients, apolloClients)
  return { isLoading, accounts, defaultAccount, refreshAccounts }
})
