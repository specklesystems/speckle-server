import { randomString } from '~~/lib/common/helpers/random'
import { login as executeLogin, resetAuthState } from '~~/lib/auth/services/login'
import { Optional } from '@speckle/shared'
import { CookieKeys } from '~~/lib/common/helpers/constants'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import { useApolloClient } from '@vue/apollo-composable'

export const useAuthCookie = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.AuthToken)

export const useAuthManager = () => {
  const {
    public: { API_ORIGIN }
  } = useRuntimeConfig()

  const challenge = randomString(10)
  const goHome = useNavigateToHome()
  const apollo = useApolloClient().client

  /**
   * Observable auth cookie
   */
  const authToken = useAuthCookie()

  /**
   * Trigger login through email & password
   */
  const loginWithEmail = async (email: string, password: string) => {
    const newToken = await executeLogin({
      email,
      password,
      apiOrigin: API_ORIGIN,
      challenge
    })

    // write to cookie
    authToken.value = newToken

    // Wipe auth state
    resetAuthState(apollo)

    // redirect home
    goHome()
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

  return { authToken, loginWithEmail, logout }
}
