import { OverridedMixpanel } from 'mixpanel-browser'
import { getCurrentInstance, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { IsLoggedInDocument } from '@/graphql/generated/graphql'
import { ComposableInvokedOutOfScopeError } from '@/main/lib/core/errors/composition'

/**
 * Get EventHub
 */
export function useEventHub() {
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  return vm.proxy.$eventHub
}

/**
 * Get Mixpanel instance (not reactive)
 */
export function useMixpanel(): OverridedMixpanel {
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  return vm.proxy.$mixpanel
}

/**
 * Composable that resolves whether the user is logged in through an Apollo query
 */
export function useIsLoggedIn() {
  const { result } = useQuery(IsLoggedInDocument)
  const isLoggedIn = computed(() => !!result.value?.user?.id)
  return { isLoggedIn }
}

/**
 * Get Vuetify
 */
export function useVuetify() {
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  return vm.proxy.$vuetify
}
