import { ApolloClient, gql } from '@apollo/client/core'
import { ApolloClients } from '@vue/apollo-composable'
import type { ComputedRef, Ref } from 'vue'
import type { Account } from '~/lib/bindings/definitions/IBasicConnectorBinding'
import { resolveClientConfig } from '~/lib/core/configs/apollo'

export type DUIAccount = {
  /** account info coming from the host app */
  accountInfo: Account
  /** the graphql client; a bit superflous */
  client?: ApolloClient<unknown>
  /** whether an intial serverinfo query succeeded. */
  isValid: boolean
}

export type DUIAccountsState = {
  accounts: Ref<DUIAccount[]>
  validAccounts: ComputedRef<DUIAccount[]>
  refreshAccounts: () => Promise<void>
  defaultAccount: ComputedRef<DUIAccount | undefined>
  loading: Ref<boolean>
}

const AccountsInjectionKey = 'DUI_ACCOUNTS_STATE'

/**
 * Use this composable to set up the account bindings and graphql clients at the top of the app.
 * TODO: Properly handle cases when user was not connected to the internet,
 * and then actually got connected.
 */
export function useAccountsSetup(): DUIAccountsState {
  const app = useNuxtApp()
  const $baseBinding = app.$baseBinding

  const accounts = ref<DUIAccount[]>([])

  const apolloClients = {} as Record<string, ApolloClient<unknown>>

  // Tries to connect to the accounts and sets their is valid prop to false if fails.
  const testAccounts = async (accs: DUIAccount[]) => {
    const accountTestQuery = gql`
      query AcccountTestQuery {
        serverInfo {
          version
          name
          company
        }
      }
    `
    for (const acc of accs) {
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
  }

  const loading = ref(false)

  // Matches local accounts coming from the host app to app state.
  const refreshAccounts = async () => {
    loading.value = true

    const accs = await $baseBinding.getAccounts()
    // We create a whole new list of accounts that will replace the old list. This way we ensure we drop
    // out of scope old accounts that not exist anymore (TODO: test), and we don't need to do complex diffing.
    const newAccs = [] as DUIAccount[]
    for (const acc of accs) {
      const existing = accounts.value.find((a) => a.accountInfo.id === acc.id)
      if (existing) {
        newAccs.push(existing as DUIAccount)
        continue
      }

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
    // We test accounts here so we try to prevent the app from querying/using invalid accounts.
    await testAccounts(newAccs)
    // Once we have tested the new accounts, finally set them.
    accounts.value = newAccs
    loading.value = false
  }

  void refreshAccounts() // Promise that we do not want to await (convention with void)

  const defaultAccount = computed(() =>
    accounts.value.find((acc) => acc.accountInfo.isDefault)
  )

  const validAccounts = computed(() => {
    return accounts.value.filter((a) => a.isValid)
  })

  const accState = {
    accounts,
    defaultAccount,
    validAccounts,
    refreshAccounts,
    loading
  }

  app.vueApp.provide(ApolloClients, apolloClients)
  provide(AccountsInjectionKey, accState)

  return accState // as DUIAccountsState
}

/**
 * Use this composable to access the users' local accounts and their corresponding graphql client.
 */
export function useInjectedAccounts(): DUIAccountsState {
  const state = inject(AccountsInjectionKey) as DUIAccountsState
  return state
}
