import { ComposableInvokedOutOfScopeError } from '@/main/lib/core/errors/composition'
import { OverridedMixpanel } from 'mixpanel-browser'
import { getCurrentInstance } from 'vue'

/**
 * Get Mixpanel instance (not reactive)
 */
export function useMixpanel(): OverridedMixpanel {
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  return vm.proxy.$mixpanel
}
