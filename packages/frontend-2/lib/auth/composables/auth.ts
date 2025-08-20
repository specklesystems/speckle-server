import {
  getAccessCode,
  getTokenFromAccessCode,
  registerAndGetAccessCode
} from '~~/lib/auth/services/auth'
import { ensureError, SafeLocalStorage } from '@speckle/shared'
import type { MaybeAsync, MaybeNullOrUndefined, Optional } from '@speckle/shared'
import { CookieKeys, LocalStorageKeys } from '~~/lib/common/helpers/constants'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import {
  loginRoute,
  useNavigateToHome,
  useNavigateToLogin
} from '~~/lib/common/helpers/route'
import { useApolloClient } from '@vue/apollo-composable'
import { speckleWebAppId } from '~~/lib/auth/helpers/strategies'
import { randomString } from '~~/lib/common/helpers/random'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { useDeferredMixpanel } from '~~/lib/core/composables/mp'
import {
  activeUserQuery,
  useResolveUserDistinctId,
  useWaitForActiveUser
} from '~~/lib/auth/composables/activeUser'
import { usePostAuthRedirect } from '~~/lib/auth/composables/postAuthRedirect'
import type { ActiveUserMainMetadataQuery } from '~~/lib/common/generated/gql/graphql'
import { useScopedState } from '~/lib/common/composables/scopedState'
import type { ApolloClient } from '@apollo/client/core'
import { AuthFailedError } from '~/lib/auth/errors/errors'

type UseOnAuthStateChangeCallback = (
  user: MaybeNullOrUndefined<ActiveUserMainMetadataQuery['activeUser']>,
  extras: {
    resolveDistinctId: ReturnType<typeof useResolveUserDistinctId>
    /**
     * Whether the auth change was triggered by an auth state reset. The only other scenario is useOnAuthStateChange being called with `immediate: true`
     */
    isReset?: boolean
  }
) => MaybeAsync<void>

const useOnAuthStateChangeState = () =>
  useScopedState('useOnAuthStateChange', () => ({
    cbs: [] as Array<UseOnAuthStateChangeCallback>
  }))

const useJustLoggedOutInSSRCookie = () =>
  useSynchronizedCookie<Optional<boolean>>('justLoggedOutInSSR')

/**
 * There's some thing we can only do from CSR (e.g. do mp.reset()), so we need to track if logout()
 * happened in SSR and then react in CSR
 */
export const useJustLoggedOutTracking = () => {
  const flag = useJustLoggedOutInSSRCookie()

  return {
    markLoggedOut: () => {
      flag.value = true
    },
    wasJustLoggedOut: () => {
      const ret = !!flag.value
      if (ret) {
        flag.value = undefined // pop
      }

      return ret
    }
  }
}

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
      await cb(awaitedUser?.data?.activeUser, { resolveDistinctId })
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
 * Composable that builds a function for resetting the active apollo auth state
 * and invoking any callbacks that are registered to listen to auth state changes
 */
const useResetAuthState = (
  options?: Partial<{
    /**
     * This composable may be invoked before Apollo is even set up, so we may need to defer
     * the injection of the Apollo client.
     *
     * Note: If deferrence is enabled, but no ApolloClient can be resolved, the reset will
     * assume there is no logged in user
     */
    deferredApollo?: () => MaybeAsync<Optional<ApolloClient<unknown>>>
  }>
) => {
  const apollo = options?.deferredApollo ? undefined : useApolloClient().client
  const resolveDistinctId = useResolveUserDistinctId()
  const { cbs } = useOnAuthStateChangeState()

  return async (
    resetOptions?: Partial<{
      /**
       * If true, won't await the full reset and return early after reset has started
       */
      lazyReset: boolean
    }>
  ) => {
    const client = apollo || (await options?.deferredApollo?.())

    let user: MaybeNullOrUndefined<ActiveUserMainMetadataQuery['activeUser']> = null
    let resetPromise: Promise<unknown> = Promise.resolve()
    if (client) {
      // evict user early
      client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeUser' })

      // evict entire cache (not enough to just evict user, various other fields
      // also depend on active user (e.g. Workspace.seatType))
      resetPromise = client.resetStore().then(async () => {
        // wait till active user is reloaded
        const { data: activeUserRes } = await client
          .query({
            query: activeUserQuery,
            fetchPolicy: 'network-only'
          })
          .catch(convertThrowIntoFetchResult)
        user = activeUserRes?.activeUser
      })
    }

    resetPromise = resetPromise.then(() => {
      // process state change callbacks
      cbs.forEach((cb) => cb(user, { resolveDistinctId, isReset: true }))
    })

    if (!resetOptions?.lazyReset) {
      await resetPromise
    }
  }
}

export const useAuthCookie = () =>
  useSynchronizedCookie<Optional<string>>(CookieKeys.AuthToken, {
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

export const useAuthManager = (
  options?: Partial<{
    /**
     * This composable may be invoked before Apollo is even set up, so we may need to defer
     * the injection of the Apollo client.
     *
     * Note: If deferrence is enabled, but no ApolloClient can be resolved, the reset will
     * assume there is no logged in user
     */
    deferredApollo?: () => MaybeAsync<Optional<ApolloClient<unknown>>>
  }>
) => {
  const { deferredApollo } = options || {}

  const apiOrigin = useApiOrigin()
  const resetAuthState = useResetAuthState({ deferredApollo })
  const route = useRoute()
  const goHome = useNavigateToHome()
  const goToLogin = useNavigateToLogin()
  const { triggerNotification } = useGlobalToast()
  const getMixpanel = useDeferredMixpanel()
  const postAuthRedirect = usePostAuthRedirect()
  const { markLoggedOut } = useJustLoggedOutTracking()
  const logger = useLogger()

  /**
   * Invite token, if any
   */
  const inviteToken = computed(() => route.query.token as Optional<string>)

  /**
   * Observable auth cookie
   */
  const authToken = useAuthCookie()

  /**
   * Token used for embedding
   */
  const embedToken = computed(() => route.query.embedToken as Optional<string>)

  /**
   * Get the effective auth token (embed token takes precedence)
   */
  const effectiveAuthToken = computed(() => embedToken.value || authToken.value)

  /**
   * Set/clear new token value and redirect to home
   */
  const saveNewToken = async (
    newToken?: string,
    options?: Partial<{ skipRedirect: boolean; skipStateReset: boolean }>
  ) => {
    const skipStateReset = options?.skipStateReset
    const skipRedirect = skipStateReset ? true : options?.skipRedirect

    // write to cookie
    authToken.value = newToken

    // reset challenge
    SafeLocalStorage.remove(LocalStorageKeys.AuthAppChallenge)

    // Wipe auth state
    if (!skipStateReset) await resetAuthState()

    // redirect home & wipe access code from querystring
    if (!skipRedirect) goHome({ query: {} })
  }

  /**
   * Check for access_code in query string and attempt to finalize login
   */
  const finalizeLoginWithAccessCode = async (
    options?: Partial<{ skipRedirect: boolean }>
  ) => {
    const accessCode = route.query['access_code'] as Optional<string>

    try {
      const challenge = SafeLocalStorage.get(LocalStorageKeys.AuthAppChallenge) || ''
      if (!challenge.length) {
        throw new AuthFailedError(
          'Empty challenge, cannot finalize login. Please reload the page and try again or contact support.'
        )
      }

      if (!accessCode) return

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
    if (import.meta.server) return

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
    if (import.meta.server) return

    watch(
      () => route.query['access_code'] as Optional<string>,
      async (newVal, oldVal) => {
        if (newVal && newVal !== oldVal) {
          try {
            await finalizeLoginWithAccessCode({
              skipRedirect: postAuthRedirect.hadPendingRedirect.value
            })

            postAuthRedirect.popAndFollowRedirect()
          } catch (e) {
            const err = ensureError(e)
            triggerNotification({
              type: ToastNotificationType.Danger,
              title: 'Authentication failed',
              description: err.message
            })
            logger.error({ err }, 'Failed to finalize login with access code')
          }
        }
      },
      { immediate: true }
    )
  }

  /**
   * Watch for embed token in query string and save it
   */
  const watchEmbedToken = () => {
    watch(
      () => embedToken.value,
      async (newVal, oldVal) => {
        if (newVal && newVal !== oldVal) {
          await resetAuthState()
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
    watchEmbedToken()
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

    getMixpanel()?.track('Log In', { type: 'action' })
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

    const registeredThisSession = useRegisteredThisSession()
    registeredThisSession.value = true

    // eslint-disable-next-line camelcase
    goHome({ query: { access_code: accessCode } })
  }

  /**
   * Initiate SSO flow. Will create a user if one does not already exist.
   */
  const signInOrSignUpWithSso = (params: {
    challenge: string
    workspaceSlug: string
    newsletterConsent?: boolean
  }) => {
    postAuthRedirect.set(`/workspaces/${params.workspaceSlug}`)

    const authUrl = new URL(
      `/api/v1/workspaces/${params.workspaceSlug}/sso/auth`,
      apiOrigin
    )
    authUrl.searchParams.set('challenge', params.challenge)
    if (params.newsletterConsent) {
      authUrl.searchParams.set('newsletter_consent', 'true')
    }
    navigateTo(authUrl.toString(), { external: true })
  }

  /**
   * Log out
   */
  const logout = async (
    options?: Partial<{
      skipToast: boolean
      skipRedirect: boolean
    }>
  ) => {
    const isServer = import.meta.server

    await saveNewToken(undefined, { skipRedirect: true, skipStateReset: !isServer })

    if (!options?.skipToast) {
      triggerNotification({
        type: ToastNotificationType.Info,
        title: 'Goodbye!',
        description: "You've been logged out"
      })
    }

    postAuthRedirect.deleteState()

    if (isServer) {
      markLoggedOut()
    }

    if (!options?.skipRedirect) {
      if (import.meta.client) {
        // we skip clearing the cache and do a full reload to avoid ugly flashes of broken content
        // during logout (while cache is in an odd state)
        window.location.href = loginRoute
      } else {
        await goToLogin()
      }
    }
  }

  return {
    authToken,
    embedToken,
    effectiveAuthToken,
    loginWithEmail,
    signUpWithEmail,
    signInOrSignUpWithSso,
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

/**
 * Indicates whether the user just completed registration
 */
export const useRegisteredThisSession = () =>
  useState<boolean>('registered-this-session', () => false)

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
