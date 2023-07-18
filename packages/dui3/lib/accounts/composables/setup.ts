import { ApolloClient } from '@apollo/client/core'
import { ApolloClients } from '@vue/apollo-composable'
import { ShallowRef, ComputedRef } from 'vue'
import { Account } from '~/lib/bindings/definitions/baseBindings'
import { resolveClientConfig } from '~/lib/core/configs/apollo'

export type DUIAccount = {
  /** account info coming from the host app */
  accountInfo: Account
  /** the graphql client; a bit superflous */
  client: ApolloClient<unknown>
}

export type DUIAccountsState = {
  accounts: ShallowRef<DUIAccount[]>
  refreshAccounts: () => Promise<void>
  defaultAccount: ComputedRef<DUIAccount | undefined>
}

const AccountsInjectionKey = 'DUI_ACCOUNTS_STATE'
/**
 * Use this composable to set up the account bindings and graphql clients at the top of the app.
 */
export function useAccountsSetup(): DUIAccountsState {
  const app = useNuxtApp()
  const $baseBinding = app.$baseBinding

  // Using a shallow ref as we don't need inner values reactive (could be a needlessly big return from host app)
  const accounts = shallowRef([] as DUIAccount[])

  const apolloClients = {} as Record<string, ApolloClient<unknown>>

  // Matches local accounts coming from the host app to app state.
  const refreshAccounts = async () => {
    const accs = await $baseBinding.getAccounts()
    // We create a whole new list of accounts that will replace the old list. This way we ensure we drop
    // out of scope old accounts that not exist anymore (TODO: test), and we don't need to do complex diffing.
    const newAccs = [] as DUIAccount[]
    for (const acc of accs) {
      const existing = accounts.value.find((a) => a.accountInfo.id === acc.id)
      if (existing) {
        newAccs.push(existing)
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
        client
      })
    }
    accounts.value = newAccs
  }

  void refreshAccounts() // Promise that we do not want to await (convention with void)

  const defaultAccount = computed(() =>
    accounts.value.find((acc) => acc.accountInfo.isDefault)
  )

  const accState = {
    accounts,
    defaultAccount,
    refreshAccounts
  }

  app.vueApp.provide(ApolloClients, apolloClients)
  provide(AccountsInjectionKey, accState)
  return accState
}

/**
 * Use this composable to access the users' local accounts and their corresponding graphql client.
 */
export function useInjectedAccounts(): DUIAccountsState {
  const state = inject(AccountsInjectionKey) as DUIAccountsState
  return state
}
