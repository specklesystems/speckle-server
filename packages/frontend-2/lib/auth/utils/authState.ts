import Cookies from 'js-cookie'
import { Nullable, SafeLocalStorage } from '@speckle/shared'
import { AuthStateRuntimeError } from '~~/lib/auth/errors/errors'
import { CookieKeys, LocalStorageKeys } from '~~/lib/common/helpers/constants'

const SSR_COOKIE_MATCH_REGEXP = new RegExp(`^${CookieKeys.AuthToken}=(.+)$`, 'i')

export type TokenRetriever = () => Nullable<string>

export function setToken(token: string) {
  if (process.server) {
    throw new AuthStateRuntimeError(
      'Setting a token is not supported on the server side!'
    )
  }

  SafeLocalStorage.set(LocalStorageKeys.AuthToken, token)
  Cookies.set(CookieKeys.AuthToken, token, {
    sameSite: 'lax',
    expires: 31 // 31 days
  })
}

export function wipe() {
  if (process.server) {
    throw new AuthStateRuntimeError(
      'Wiping the auth state is not supported on the server side!'
    )
  }

  SafeLocalStorage.remove(LocalStorageKeys.AuthToken)
  Cookies.remove(CookieKeys.AuthToken)
}

/**
 * Vue Composable for getting the Speckle authentication token
 */
export function useAuthToken(): TokenRetriever {
  if (process.client) {
    return () => {
      let token = SafeLocalStorage.get(LocalStorageKeys.AuthToken)
      if (!token) {
        token = Cookies.get(CookieKeys.AuthToken) || null
      }

      return token
    }
  }

  // ssr implementation
  const { ssrContext } = useNuxtApp()
  if (!ssrContext) {
    throw new AuthStateRuntimeError('Nuxt ssrContext unavailable on serverside!')
  }

  // cookie parsing is pretty low level, but i don't see the point of extending the SSR request API with helpers
  // just for this
  const req = ssrContext.event.req
  const headers = req.headers
  const cookies = headers.cookie?.split('; ') || []

  const cookieEntry = cookies.find((entry) => SSR_COOKIE_MATCH_REGEXP.test(entry))
  if (!cookieEntry) return () => null

  const [, authToken] = cookieEntry.match(SSR_COOKIE_MATCH_REGEXP) || []

  return () => authToken
}
