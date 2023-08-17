import { defineStore } from 'pinia'
import { useInjectedAccounts } from '~/lib/accounts/composables/setup'

// NOTE: this store simply wraps around the injected accounts composable (for now)
export const useAccountStore = defineStore('accountStore', () => {
  const { accounts, refreshAccounts, defaultAccount, validAccounts, loading } =
    useInjectedAccounts()

  return { accounts, refreshAccounts, defaultAccount, validAccounts, loading }
})
