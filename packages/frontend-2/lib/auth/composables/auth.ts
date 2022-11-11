import {
  resetAuthState,
  getAccessCode,
  getTokenFromAccessCode
} from '~~/lib/auth/services/login'
import { Optional, SafeLocalStorage } from '@speckle/shared'
import { CookieKeys, LocalStorageKeys } from '~~/lib/common/helpers/constants'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import { useApolloClient } from '@vue/apollo-composable'

/**
 * TODO:
 * - Invite redirects from server
 * - Verify overall flow - does this make sense (from a security perspective as well)?
 *  - Does challenge do anything?
 *  - Do we really need this back and forth of multiple requests for local auth?
 *  - Can we get rid of backend redirecting to / with access_code in querystring?
 */

export const useAuthCookie = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.AuthToken)

export const useAuthManager = () => {
  const {
    public: { API_ORIGIN }
  } = useRuntimeConfig()

  const route = useRoute()
  const goHome = useNavigateToHome()
  const apollo = useApolloClient().client

  /**
   * Observable auth cookie
   */
  const authToken = useAuthCookie()

  const saveNewToken = (newToken: string) => {
    // write to cookie
    authToken.value = newToken

    // reset challenge
    SafeLocalStorage.remove(LocalStorageKeys.AuthAppChallenge)

    // Wipe auth state
    resetAuthState(apollo)

    // redirect home
    goHome({ query: {} })
  }

  /**
   * Check for access_code in query string and attempt to finalize login
   */
  const finalizeLoginWithAccessCode = async () => {
    const accessCode = route.query['access_code'] as Optional<string>
    const challenge = SafeLocalStorage.get(LocalStorageKeys.AuthAppChallenge) || ''
    if (!accessCode) return

    const newToken = await getTokenFromAccessCode({
      accessCode,
      challenge,
      apiOrigin: API_ORIGIN
    })

    saveNewToken(newToken)
  }

  /**
   * Watch for changes to query string and when access_code is set trigger login finalization
   */
  const watchLoginAccessCode = () => {
    if (process.server) return

    watch(
      () => route.query['access_code'] as Optional<string>,
      (newVal, oldVal) => {
        if (newVal && newVal !== oldVal) {
          finalizeLoginWithAccessCode()
        }
      },
      { immediate: true }
    )
  }

  /**
   * Trigger login through email & password
   */
  const loginWithEmail = async (params: {
    email: string
    password: string
    challenge: string
  }) => {
    const { email, password, challenge } = params

    const { accessCode } = await getAccessCode({
      email,
      password,
      apiOrigin: API_ORIGIN,
      challenge
    })

    // eslint-disable-next-line camelcase
    goHome({ query: { access_code: accessCode } })
  }

  /**
   * Log out
   */
  const logout = () => {
    // Wipe cookie
    authToken.value = undefined

    // Wipe auth state
    resetAuthState(apollo)

    // Redirect home
    goHome()
  }

  return { authToken, loginWithEmail, logout, watchLoginAccessCode }
}
