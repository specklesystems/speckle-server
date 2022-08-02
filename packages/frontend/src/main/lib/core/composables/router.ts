import { Optional } from '@/helpers/typeHelpers'
import { ComposableInvokedOutOfScopeError } from '@/main/lib/core/errors/composition'
import { getCurrentInstance, reactive } from 'vue'
import VueRouter, { Route } from 'vue-router'

let currentRoute: Optional<Route>

/**
 * Get router (not reactive)
 */
export function useRouter(): VueRouter {
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  return vm.proxy.$router
}

/**
 * Get current route object (reactive)
 */
export function useRoute(): Route {
  if (currentRoute) return currentRoute

  const router = useRouter()
  const vm = getCurrentInstance()
  if (!vm) throw new ComposableInvokedOutOfScopeError()

  const newRoute = reactive({ ...vm.proxy.$route } as Route)
  router.afterEach((to) => {
    Object.assign(newRoute, to)
  })
  currentRoute = newRoute

  return newRoute
}
