import type { AccTokens } from '@speckle/shared/acc'
import Cookies from 'js-cookie'

/**
 * Manages authentication logic of ACC.
 * We store tokens and its timestamp in under `acc_tokens` cookie.
 * Detection of "Refresh needed" happens with timestamp check.
 * ACC auth logic returns only expires in seconds and we need to correlate it with timestamp to substract later to understand refresh needed or not.
 * Token lifespans:
 * - Bearer token: 60 minutes
 * - Refresh token: 15 days
 */
export function useAccAuthManager() {
  const ACC_COOKIE_KEY = 'acc_tokens'
  const logger = useLogger()
  const apiOrigin = useApiOrigin()
  const { triggerNotification } = useGlobalToast()
  const loadingTokens = ref(false)
  const tokens = ref<AccTokens>()
  const REFRESH_TOKEN_LIFESPAN = 15 * 24 * 60 * 60 // in seconds

  /**
   * Main logic to understand existing token in cookies is expired or not.
   * If refresh needed, we refresh and schedule
   * Otherwise, we calculate the time diff and schedule refresh accordingly
   */
  const tryGetTokensFromCookies = async () => {
    const accTokens = Cookies.get(ACC_COOKIE_KEY)
    if (accTokens) {
      logger.info('Acc tokens are found in cookies')
      const tokensInCookies = JSON.parse(accTokens) as AccTokens
      const timeDiff = (Date.now() - tokensInCookies.timestamp) / 1000 // in seconds

      if (timeDiff > REFRESH_TOKEN_LIFESPAN) {
        logger.info('Acc refresh token in cookies is expired')
        tokens.value = undefined
        Cookies.remove(ACC_COOKIE_KEY)
      } else if (timeDiff + 300 > tokensInCookies.expires_in) {
        logger.info('Acc access token in cookies need refreshing')
        // 300s (6min) is arbitrary guard
        const refreshedTokens = await refreshTokens(tokensInCookies)
        tokens.value = refreshedTokens
        await saveTokensToCookies()
        if (tokens.value) scheduleRefresh(tokens.value)
      } else {
        logger.info('Acc tokens in cookies still valid')
        tokens.value = tokensInCookies
        const remainingTime = tokensInCookies.expires_in - timeDiff
        scheduleRefresh(tokens.value, remainingTime)
      }
    }
    loadingTokens.value = false
  }

  const refreshTokens = async (tokensToRefresh: AccTokens) => {
    try {
      loadingTokens.value = true
      const res = await fetch(`${apiOrigin}/api/v1/acc/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokensToRefresh)
      })
      if (res.ok) {
        const refreshedTokens = await res.json()
        tokens.value = { ...refreshedTokens, timestamp: Date.now() }
        return refreshedTokens
      }
    } catch (error) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error on refreshing ACC credientials',
        description: error instanceof Error ? error.message : 'Unexpected error'
      })
    } finally {
      loadingTokens.value = false
    }
  }

  const saveTokensToCookies = async () => {
    const tokensWithTimestamp = { ...tokens.value, timestamp: Date.now() }
    Cookies.set('acc_tokens', JSON.stringify(tokensWithTimestamp), {
      expires: 30, // since acc refresh token lifespan 15 days, it is a safe expiration
      secure: true,
      sameSite: 'Strict'
    })
  }

  const fetchTokens = async () => {
    try {
      loadingTokens.value = true
      const res = await fetch(`${apiOrigin}/api/v1/acc/auth/status`, {
        credentials: 'include'
      })
      if (!res.ok) return
      tokens.value = await res.json()
      if (tokens.value?.expires_in) {
        scheduleRefresh(tokens.value)
      }
      await saveTokensToCookies()
    } finally {
      loadingTokens.value = false
    }
  }

  const authAcc = async (projectId: string) => {
    try {
      const response = await fetch(`${apiOrigin}/api/v1/acc/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      if (!response.ok) throw new Error('Failed to initiate ACC login.')
      const { authorizeUrl } = await response.json()
      if (!authorizeUrl) throw new Error('No authorize URL returned by server.')
      window.location.href = authorizeUrl
    } catch (error) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error starting ACC login',
        description: error instanceof Error ? error.message : 'Unexpected error'
      })
    }
  }

  const scheduleRefresh = (
    tokensToScheduleRefresh: AccTokens,
    resfreshInSeconds?: number
  ) => {
    const refreshTimeInMs =
      (resfreshInSeconds ?? tokensToScheduleRefresh.expires_in) * 1000
    setTimeout(async () => {
      loadingTokens.value = true
      const res = await fetch(`${apiOrigin}/api/v1/acc/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokensToScheduleRefresh)
      })
      if (res.ok) {
        const refreshed = await res.json()
        tokens.value = refreshed
        // triggerNotification({
        //   type: ToastNotificationType.Success,
        //   title: 'ACC tokens refreshed'
        // })
        await saveTokensToCookies()
        scheduleRefresh(refreshed, refreshed.expires_in)
      }
      loadingTokens.value = false
    }, refreshTimeInMs)
  }

  return {
    tokens,
    loadingTokens,
    authAcc,
    fetchTokens,
    refreshTokens,
    tryGetTokensFromCookies,
    saveTokensToCookies
  }
}
