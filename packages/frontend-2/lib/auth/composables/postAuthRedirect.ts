import type { RouteLocationNormalized } from '#vue-router'
import type { Optional } from '@speckle/shared'
import { reduce } from 'lodash-es'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { CookieKeys } from '~~/lib/common/helpers/constants'

const usePostAuthRedirectCookie = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.PostAuthRedirect, {
    maxAge: 60 * 5 // 5 mins
  })

export const usePostAuthRedirect = (
  options?: Partial<{ route: RouteLocationNormalized }>
) => {
  const cookie = usePostAuthRedirectCookie()
  const router = useRouter()
  const route = options?.route || useRoute()
  const logger = useLogger()

  const hadPendingRedirect = computed(() => !!cookie.value?.length)

  const deleteState = () => (cookie.value = undefined)
  const set = (pathWithQuery: string, force?: boolean) => {
    const currVal = cookie.value
    if (currVal && !force) return
    cookie.value = pathWithQuery
  }
  const setCurrentRoute = (force?: boolean) => {
    set(route.fullPath, force)
  }
  const popAndFollowRedirect = () => {
    const pathWithQuery = cookie.value
    if (!pathWithQuery) return

    deleteState()

    if (import.meta.server) {
      const url = new URL(pathWithQuery, 'http://notimportant.com')
      router
        .push({
          path: url.pathname,
          query: reduce(
            [...url.searchParams.entries()],
            (result, entry) => {
              result[entry[0]] = entry[1]
              return result
            },
            {} as Record<string, string>
          )
        })
        .catch(logger.error)
    } else {
      // cause nuxt doesn't show error page for some reason
      window.location.href = pathWithQuery
    }
  }

  return {
    set,
    deleteState,
    popAndFollowRedirect,
    setCurrentRoute,
    hadPendingRedirect
  }
}
