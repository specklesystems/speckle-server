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
 * Composable that resolves user auth information through an Apollo query
 */
export function useIsLoggedIn() {
  const { result } = useQuery(IsLoggedInDocument)
  const userId = computed(() => result.value?.activeUser?.id)
  const isLoggedIn = computed(() => !!userId.value)
  return { isLoggedIn, userId }
}

/**
 * Get Vuetify
 */
export function useVuetify() {
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  return vm.proxy.$vuetify
}
