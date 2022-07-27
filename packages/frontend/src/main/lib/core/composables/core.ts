import { ComposableInvokedOutOfScopeError } from '@/main/lib/core/errors/composition'
import { getCurrentInstance } from 'vue'

/**
 * Get EventHub
 */
export function useEventHub() {
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  return vm.proxy.$eventHub
}
