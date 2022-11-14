import {
  resetAuthState,
  getAccessCode,
  getTokenFromAccessCode,
  registerAndGetAccessCode
} from '~~/lib/auth/services/auth'
import { ensureError, Optional, SafeLocalStorage } from '@speckle/shared'
import { CookieKeys, LocalStorageKeys } from '~~/lib/common/helpers/constants'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import { useApolloClient } from '@vue/apollo-composable'
import { speckleWebAppId } from '~~/lib/auth/helpers/strategies'
import { randomString } from '~~/lib/common/helpers/random'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

/**
 * TODO:
 * - OAuth error page w/ message passed from server
 * - Invite only servers
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
  const { triggerNotification } = useGlobalToast()

  /**
   * Observable auth cookie
   */
  const authToken = useAuthCookie()

  /**
   * Set/clear new token value and redirect to home
   */
  const saveNewToken = (newToken?: string) => {
    // write to cookie
    authToken.value = newToken

    // reset challenge
    SafeLocalStorage.remove(LocalStorageKeys.AuthAppChallenge)

    // Wipe auth state
    resetAuthState(apollo)

    // redirect home & wipe access code from querystring
    goHome({ query: {} })
  }

  /**
   * Check for access_code in query string and attempt to finalize login
   */
  const finalizeLoginWithAccessCode = async () => {
    const accessCode = route.query['access_code'] as Optional<string>
    const challenge = SafeLocalStorage.get(LocalStorageKeys.AuthAppChallenge) || ''
    if (!accessCode) return

    try {
      const newToken = await getTokenFromAccessCode({
        accessCode,
        challenge,
        apiOrigin: API_ORIGIN
      })

      saveNewToken(newToken)
    } catch (error) {
      saveNewToken(undefined)
      throw error
    }
  }

  /**
   * Check for 'emailverifiedstatus' in query string and report it to user
   */
  const watchEmailVerificationStatus = () => {
    if (process.server) return

    watch(
      () =>
        <const>[
          route.query['emailverifiedstatus'] as Optional<string>,
          route.query['emailverifiederror'] as Optional<string>
        ],
      (newVals, oldVals) => {
        const [newStatus, newError] = newVals
        const [oldStatus, oldError] = oldVals || []

        const isNewStatus = newStatus && newStatus !== oldStatus
        const isNewError = newError && newError !== oldError

        if (isNewStatus && newStatus === 'true') {
          triggerNotification({
            type: ToastNotificationType.Success,
            title: 'Email successfully verified!'
          })

          // wipe report
          goHome({ query: {} })
        } else if (isNewError) {
          triggerNotification({
            type: ToastNotificationType.Danger,
            title: 'Email verification failed',
            description: newError
          })

          // wipe report
          goHome({ query: {} })
        }
      },
      { immediate: true }
    )
  }

  /**
   * Watch for changes to query string and when access_code is set trigger login finalization
   */
  const watchLoginAccessCode = () => {
    if (process.server) return

    watch(
      () => route.query['access_code'] as Optional<string>,
      async (newVal, oldVal) => {
        if (newVal && newVal !== oldVal) {
          try {
            await finalizeLoginWithAccessCode()

            triggerNotification({
              type: ToastNotificationType.Success,
              title: 'Authentication successful'
            })
          } catch (e) {
            triggerNotification({
              type: ToastNotificationType.Danger,
              title: 'Authentication failed',
              description: `${ensureError(e).message}`
            })
          }
        }
      },
      { immediate: true }
    )
  }

  /**
   * Sets up querystring watchers that trigger various auth related activities like email verification status reports etc.
   */
  const watchAuthQueryString = () => {
    watchLoginAccessCode()
    watchEmailVerificationStatus()
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
   * Trigger registration procedure with email & password
   */
  const signUpWithEmail = async (params: {
    user: {
      email: string
      password: string
      name: string
      company?: string
    }
    challenge: string
  }) => {
    const { user, challenge } = params

    const { accessCode } = await registerAndGetAccessCode({
      apiOrigin: API_ORIGIN,
      challenge,
      user
    })

    // eslint-disable-next-line camelcase
    goHome({ query: { access_code: accessCode } })
  }

  /**
   * Log out
   */
  const logout = () => {
    saveNewToken()
  }

  return { authToken, loginWithEmail, signUpWithEmail, logout, watchAuthQueryString }
}

const useAuthAppIdAndChallenge = () => {
  const route = useRoute()
  const appId = ref('')
  const challenge = ref('')

  onMounted(() => {
    // Resolve challenge & appId from querystring or generate them
    const queryChallenge = route.query.challenge as Optional<string>
    const queryAppId = route.query.appId as Optional<string>

    appId.value = queryAppId || speckleWebAppId

    if (queryChallenge) {
      challenge.value = queryChallenge
    } else if (appId.value === speckleWebAppId) {
      const newChallenge = randomString(10)

      SafeLocalStorage.set(LocalStorageKeys.AuthAppChallenge, newChallenge)
      challenge.value = newChallenge
    }
  })

  return { appId, challenge }
}

export const useLoginOrRegisterUtils = () => {
  const appIdAndChallenge = useAuthAppIdAndChallenge()
  return {
    ...appIdAndChallenge
  }
}
