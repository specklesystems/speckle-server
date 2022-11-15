import {
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
import {
  useMixpanel,
  useMixpanelUserIdentification
} from '~~/lib/core/composables/mixpanel'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

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

/**
 * Composable that builds a function for resetting the active auth state.
 * This means resetting mixpanel identification, wiping apollo `me` cache etc.
 */
const useResetAuthState = () => {
  const apollo = useApolloClient().client
  const { reidentify } = useMixpanelUserIdentification()
  const { refetch } = useActiveUser()

  return async () => {
    // evict cache
    apollo.cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeUser' })

    // wait till active user is reloaded
    await refetch()

    // re-identify mixpanel user
    reidentify()
  }
}

export const useAuthCookie = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.AuthToken)

export const useAuthManager = () => {
  const {
    public: { API_ORIGIN }
  } = useRuntimeConfig()

  const resetAuthState = useResetAuthState()
  const route = useRoute()
  const goHome = useNavigateToHome()
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()

  /**
   * Invite token, if any
   */
  const inviteToken = computed(() => route.query.token as Optional<string>)

  /**
   * Observable auth cookie
   */
  const authToken = useAuthCookie()

  /**
   * Set/clear new token value and redirect to home
   */
  const saveNewToken = async (newToken?: string) => {
    // write to cookie
    authToken.value = newToken

    // reset challenge
    SafeLocalStorage.remove(LocalStorageKeys.AuthAppChallenge)

    // Wipe auth state
    await resetAuthState()

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

      await saveNewToken(newToken)
    } catch (error) {
      await saveNewToken(undefined)
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

    mixpanel.track('Log In', { type: 'action' })
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

    mixpanel.track('Sign Up', {
      type: 'action',
      isInvite: !!inviteToken.value
    })
  }

  /**
   * Log out
   */
  const logout = async () => {
    await saveNewToken()
  }

  return {
    authToken,
    loginWithEmail,
    signUpWithEmail,
    logout,
    watchAuthQueryString,
    inviteToken
  }
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
