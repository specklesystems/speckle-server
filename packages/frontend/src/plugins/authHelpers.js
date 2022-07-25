import { mainUserDataQuery } from '@/graphql/user'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import md5 from '@/helpers/md5'
import { VALID_EMAIL_REGEX } from '@/main/lib/common/vuetify/validators'

const appId = 'spklwebapp'
const appSecret = 'spklwebapp'

export function getAuthToken() {
  try {
    return localStorage.getItem(LocalStorageKeys.AuthToken)
  } catch (e) {
    // suppressed localStorage errors
  }

  return null
}

/**
 * Checks for an access token in the url and tries to exchange it for a token/refresh pair.
 * @return {boolean} true if everything is ok, otherwise throws an error.
 */
export async function checkAccessCodeAndGetTokens() {
  const accessCode = new URLSearchParams(window.location.search).get('access_code')
  if (accessCode) {
    const response = await getTokenFromAccessCode(accessCode)
    // eslint-disable-next-line no-prototype-builtins
    if (response.hasOwnProperty('token')) {
      localStorage.setItem(LocalStorageKeys.AuthToken, response.token)
      localStorage.setItem(LocalStorageKeys.RefreshToken, response.refreshToken)
      return true
    }
  } else {
    throw new Error(`No access code present in the url: ${window.location.href}`)
  }
}

/**
 * Gets the user id and suuid, sets them in local storage
 * @param {import('@apollo/client/core').ApolloClient} apolloClient
 * @return {Object} The full graphql response.
 */
export async function prefetchUserAndSetSuuid(apolloClient) {
  const token = localStorage.getItem(LocalStorageKeys.AuthToken)
  if (!token) return

  // Pull user info (& remember it in the Apollo cache)
  const { data } = await apolloClient.query({
    query: mainUserDataQuery
  })

  if (data.user) {
    // eslint-disable-next-line camelcase
    const distinct_id = '@' + md5(data.user.email.toLowerCase()).toUpperCase()

    localStorage.setItem('suuid', data.user.suuid)
    localStorage.setItem('distinct_id', distinct_id)
    localStorage.setItem('uuid', data.user.id)
    localStorage.setItem('stcount', data.user.streams.totalCount)
    return data
  } else {
    await signOut()
    throw new Error('Failed to set user')
  }
}

export async function getTokenFromAccessCode(accessCode) {
  const response = await fetch('/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      accessCode,
      appId,
      appSecret,
      challenge: localStorage.getItem('appChallenge')
    })
  })

  const data = await response.json()
  return data
}

/**
 * Signs out the current session
 * @return {null}
 */
export async function signOut(mixpanelInstance) {
  await fetch('/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: localStorage.getItem(LocalStorageKeys.AuthToken),
      refreshToken: localStorage.getItem(LocalStorageKeys.RefreshToken)
    })
  })

  localStorage.removeItem(LocalStorageKeys.AuthToken)
  localStorage.removeItem(LocalStorageKeys.RefreshToken)
  localStorage.removeItem('suuid')
  localStorage.removeItem('uuid')
  localStorage.removeItem('distinct_id')
  localStorage.removeItem('stcount')
  localStorage.removeItem('onboarding')

  window.location = '/'

  if (mixpanelInstance) {
    mixpanelInstance.track('Log Out', { type: 'action' })
    mixpanelInstance.reset()
  }
}

export async function refreshToken() {
  const refreshToken = localStorage.getItem(LocalStorageKeys.RefreshToken)
  if (!refreshToken) throw new Error('No refresh token found')

  const refreshResponse = await fetch('/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken,
      appId,
      appSecret
    })
  })

  const data = await refreshResponse.json()

  // eslint-disable-next-line no-prototype-builtins
  if (data.hasOwnProperty('token')) {
    localStorage.setItem(LocalStorageKeys.AuthToken, data.token)
    localStorage.setItem(LocalStorageKeys.RefreshToken, data.refreshToken)
    await prefetchUserAndSetSuuid()
    return true
  }
}

export function isEmailValid(email) {
  return VALID_EMAIL_REGEX.test(email)
}
