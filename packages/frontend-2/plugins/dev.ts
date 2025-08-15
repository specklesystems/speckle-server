import { useApolloClientFromNuxt } from '~~/lib/common/composables/graphql'
import { useAuthCookie } from '~~/lib/auth/composables/auth'

export default defineNuxtPlugin(() => {
  const logger = useLogger()
  const route = useRoute()
  const router = useRouter()

  if (!import.meta.dev) return
  if (!import.meta.client) return

  logger.debug('🚧 Running FE2 in dev mode, extra debugging tools may be available...')

  const authToken = useAuthCookie()
  const debugRoutes = route.query.debugRoutes === '1'

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  window.AUTH_TOKEN = {
    set: (newVal?: string) => (authToken.value = newVal || undefined),
    get: () => authToken.value
  }

  const client = useApolloClientFromNuxt()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  window.APOLLO_CLIENT = client

  if (debugRoutes) {
    // Debug navigations
    router.beforeEach((to, from) => {
      logger.debug(`BEFORE: ${from.fullPath} to ${to.fullPath}`)
    })

    router.afterEach((to, from) => {
      logger.debug(`AFTER:  ${from.fullPath} to ${to.fullPath}`)
    })
  }

  return {
    provide: {
      debugRoutes
    }
  }
})
