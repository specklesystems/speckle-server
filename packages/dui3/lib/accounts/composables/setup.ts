import { ApolloClient } from '@apollo/client/core'
import { ApolloClients } from '@vue/apollo-composable'
import { ShallowRef } from 'vue'
import { resolveClientConfig } from '~/lib/core/configs/apollo'
import { Account } from '~/types'

export type DUIAccount = {
  accountInfo: Account
  client: ApolloClient<unknown>
}

export type DUIAccountsState = {
  accounts: ShallowRef<DUIAccount[]>
  refreshAccounts: () => Promise<void>
}

const AccountsInjectionKey = 'DUI_ACCOUNTS_STATE'

export async function useAccountsSetup() {
  const app = useNuxtApp()
  const $bindings = app.$bindings

  // Using a shallow ref as we don't need inner values reactive
  const accounts = shallowRef([] as DUIAccount[])

  const apolloClients = {} as Record<string, ApolloClient<unknown>>

  // Matches local accounts coming from the host app to app state.
  const refreshAccounts = async () => {
    const accs = JSON.parse(await $bindings.getAccounts()) as Account[]
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

  await refreshAccounts()

  const accState = {
    accounts,
    refreshAccounts
  }

  app.vueApp.provide(ApolloClients, apolloClients)
  provide(AccountsInjectionKey, accState)
  return accState
}

export function useInjectedAccounts() {
  const state = inject(AccountsInjectionKey) as DUIAccountsState
  return state
}
