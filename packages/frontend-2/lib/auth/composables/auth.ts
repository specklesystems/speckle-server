import {
  getAccessCode,
  getTokenFromAccessCode,
  registerAndGetAccessCode
} from '~~/lib/auth/services/auth'
import { ensureError, SafeLocalStorage } from '@speckle/shared'
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import { CookieKeys, LocalStorageKeys } from '~~/lib/common/helpers/constants'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { useNavigateToHome, useNavigateToLogin } from '~~/lib/common/helpers/route'
import { useApolloClient } from '@vue/apollo-composable'
import { speckleWebAppId } from '~~/lib/auth/helpers/strategies'
import { randomString } from '~~/lib/common/helpers/random'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useActiveUser,
  useResolveUserDistinctId,
  useWaitForActiveUser
} from '~~/lib/auth/composables/activeUser'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import type { ActiveUserMainMetadataQuery } from '~~/lib/common/generated/gql/graphql'
import { useScopedState } from '~/lib/common/composables/scopedState'

type UseOnAuthStateChangeCallback = (
  user: MaybeNullOrUndefined<ActiveUserMainMetadataQuery['activeUser']>,
  extras: { resolveDistinctId: ReturnType<typeof useResolveUserDistinctId> }
) => void

const useOnAuthStateChangeState = () =>
  useScopedState('useOnAuthStateChange', () => ({
    cbs: [] as Array<UseOnAuthStateChangeCallback>
  }))

/**
 * Do something when the app auth state changes (user logged in or not). Useful for imperatively
 * identifying/unidentifying users on mixpanel & other observability tools.
 *
 * Use the return to manually remove the callback
 */
export const useOnAuthStateChange = () => {
  const { cbs } = useOnAuthStateChangeState()
  const waitForUser = useWaitForActiveUser()
  const activeVueInstance = getCurrentInstance()
  const resolveDistinctId = useResolveUserDistinctId()

  return async (
    cb: UseOnAuthStateChangeCallback,
    options?: Partial<{ immediate: boolean }>
  ) => {
    cbs.push(cb)

    if (options?.immediate) {
      const awaitedUser = await waitForUser()
      cb(awaitedUser?.data?.activeUser, { resolveDistinctId })
    }

    const remove = () => {
      const idx = cbs.indexOf(cb)
      if (idx > -1) cbs.splice(idx, 1)
    }

    if (activeVueInstance) {
      onUnmounted(() => {
        remove()
      }, activeVueInstance)
    }

    return remove
  }
}

export const useGetInitialAuthState = () => {
  const waitForUser = useWaitForActiveUser()
  const resolveDistinctId = useResolveUserDistinctId()

  return async () => {
    const user = await waitForUser()
    return {
      user: user?.data?.activeUser,
      distinctId: resolveDistinctId(user?.data?.activeUser)
    }
  }
}

/**
 * Composable that builds a function for resetting the active auth state.
 * This means resetting mixpanel identification, wiping apollo `me` cache etc.
 */
const useResetAuthState = () => {
  const apollo = useApolloClient().client
  const { refetch } = useActiveUser()
  const resolveDistinctId = useResolveUserDistinctId()

  return async () => {
    // evict cache
    apollo.cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeUser' })

    // wait till active user is reloaded
    const activeUserRes = await refetch()
    const user = activeUserRes?.data?.activeUser

    // process state change callbacks
    const { cbs } = useOnAuthStateChangeState()
    cbs.forEach((cb) => cb(user, { resolveDistinctId }))
  }
}

export const useAuthCookie = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.AuthToken, {
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

export const useAuthManager = () => {
  const apiOrigin = useApiOrigin()
  const resetAuthState = useResetAuthState()
  const route = useRoute()
  const goHome = useNavigateToHome()
  const goToLogin = useNavigateToLogin()
  const { triggerNotification } = useGlobalToast()
  const mixpanel = useMixpanel()
  const postAuthRedirect = usePostAuthRedirect()

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
  const saveNewToken = async (
    newToken?: string,
    options?: Partial<{ skipRedirect: boolean }>
  ) => {
    // write to cookie
    authToken.value = newToken

    // reset challenge
    SafeLocalStorage.remove(LocalStorageKeys.AuthAppChallenge)

    // Wipe auth state
    await resetAuthState()

    // redirect home & wipe access code from querystring
    if (!options?.skipRedirect) goHome({ query: {} })
  }

  /**
   * Check for access_code in query string and attempt to finalize login
   */
  const finalizeLoginWithAccessCode = async (
    options?: Partial<{ skipRedirect: boolean }>
  ) => {
    const accessCode = route.query['access_code'] as Optional<string>
    const challenge = SafeLocalStorage.get(LocalStorageKeys.AuthAppChallenge) || ''
    if (!accessCode) return

    try {
      const newToken = await getTokenFromAccessCode({
        accessCode,
        challenge,
        apiOrigin
      })

      await saveNewToken(newToken, options)
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
   * (either used just logged in or registered)
   */
  const watchLoginAccessCode = () => {
    if (process.server) return

    watch(
      () => route.query['access_code'] as Optional<string>,
      async (newVal, oldVal) => {
        if (newVal && newVal !== oldVal) {
          try {
            await finalizeLoginWithAccessCode({
              skipRedirect: postAuthRedirect.hadPendingRedirect.value
            })

            triggerNotification({
              type: ToastNotificationType.Success,
              title: 'Welcome!',
              description: "You've been successfully authenticated"
            })

            postAuthRedirect.popAndFollowRedirect()
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
      apiOrigin,
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
    inviteToken?: string
    newsletter?: boolean
  }) => {
    const { user, challenge, inviteToken, newsletter } = params

    const { accessCode } = await registerAndGetAccessCode({
      apiOrigin,
      challenge,
      user,
      inviteToken,
      newsletter
    })

    // eslint-disable-next-line camelcase
    goHome({ query: { access_code: accessCode } })
  }

  /**
   * Log out
   */
  const logout = async (
    options?: Partial<{
      skipToast: boolean
    }>
  ) => {
    await saveNewToken(undefined, { skipRedirect: true })

    if (!options?.skipToast) {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Goodbye!',
        description: "You've been logged out"
      })
    }

    postAuthRedirect.deleteState()
    goToLogin()
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
    const queryChallenge =
      (route.query.challenge as Optional<string>) ||
      SafeLocalStorage.get(LocalStorageKeys.AuthAppChallenge)
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
  const route = useRoute()

  /**
   * Invite token, if any
   */
  const inviteToken = computed(() => route.query.token as Optional<string>)

  return {
    ...appIdAndChallenge,
    inviteToken
  }
}
