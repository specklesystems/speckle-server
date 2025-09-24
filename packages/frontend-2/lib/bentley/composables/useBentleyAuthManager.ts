import Cookies from 'js-cookie'

export function useBentleyAuthManager() {
  const BENTLEY_ITWIN_COOKIE_KEY = 'bentley_itwin_tokens'
  const apiOrigin = useApiOrigin()
  const { triggerNotification } = useGlobalToast()
  const tokens = ref<any>() // TODO
  const isExpired = ref(false)
  const loadingTokens = ref(false)
  const logger = useLogger()

  const tryGetTokensFromCookies = async () => {
    const bentleyTokens = Cookies.get(BENTLEY_ITWIN_COOKIE_KEY)
    if (bentleyTokens) {
      logger.info('Bentley tokens are found in cookies')
      const tokensInCookies = JSON.parse(bentleyTokens) as any
      // const timeDiff = (Date.now() - tokensInCookies.timestamp) / 1000 // in seconds

      tokens.value = tokensInCookies
      await saveTokensToCookies()

      // if (timeDiff > REFRESH_TOKEN_LIFESPAN) {
      //   logger.info('Bentley refresh token in cookies is expired')
      //   isExpired.value = true
      //   logOut()
      // } else if (timeDiff + 300 > tokensInCookies.expires_in) {
      //   logger.info('Bentley access token in cookies need refreshing')
      //   // 300s (6min) is arbitrary guard
      //   const refreshedTokens = await refreshTokens(tokensInCookies)
      //   tokens.value = refreshedTokens
      //   await saveTokensToCookies()
      //   if (tokens.value) scheduleRefresh(tokens.value)
      // } else {
      //   logger.info('Acc tokens in cookies still valid')
      //   tokens.value = tokensInCookies
      //   const remainingTime = tokensInCookies.expires_in - timeDiff
      //   scheduleRefresh(tokens.value, remainingTime)
      // }
    }
    loadingTokens.value = false
  }

  const authBentley = async (callbackEndpoint: string) => {
    try {
      const response = await fetch(`${apiOrigin}/api/v1/bentley-itwin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callbackEndpoint })
      })
      if (!response.ok) throw new Error('Failed to initiate Bentley login.')
      const { authorizeUrl } = await response.json()
      if (!authorizeUrl) throw new Error('No authorize URL returned by server.')
      window.location.href = authorizeUrl
    } catch (error) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'Error starting Bentley login',
        description: error instanceof Error ? error.message : 'Unexpected error'
      })
    }
  }

  const logOut = () => {
    tokens.value = undefined
    Cookies.remove(BENTLEY_ITWIN_COOKIE_KEY)
  }

  const saveTokensToCookies = async () => {
    const tokensWithTimestamp = { ...tokens.value, timestamp: Date.now() }
    Cookies.set(BENTLEY_ITWIN_COOKIE_KEY, JSON.stringify(tokensWithTimestamp), {
      expires: 30, // since acc refresh token lifespan 15 days, it is a safe expiration
      secure: true,
      sameSite: 'Strict'
    })
    isExpired.value = false
  }

  const fetchTokens = async () => {
    try {
      loadingTokens.value = true
      const res = await fetch(`${apiOrigin}/api/v1/bentley-itwin/auth/status`, {
        credentials: 'include'
      })
      if (!res.ok) return
      tokens.value = await res.json()
      console.log(tokens.value)

      // if (tokens.value?.expires_in) {
      //   scheduleRefresh(tokens.value)
      // }
      await saveTokensToCookies()
    } finally {
      loadingTokens.value = false
    }
  }

  return {
    tokens,
    isExpired,
    authBentley,
    tryGetTokensFromCookies,
    logOut,
    saveTokensToCookies,
    fetchTokens
  }
}
