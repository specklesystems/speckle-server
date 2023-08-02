import { mainUserDataQuery } from '@/graphql/user'
import { LocalStorageKeys } from '@/helpers/mainConstants'
import { InvalidAuthTokenError } from '@/main/lib/auth/errors'
import { VALID_EMAIL_REGEX } from '@/main/lib/common/vuetify/validators'
import { AppLocalStorage } from '@/utils/localStorage'
import { has } from 'lodash'
import { deletePostAuthRedirect } from '@/main/lib/auth/utils/postAuthRedirectManager'
import { resolveMixpanelUserId } from '@speckle/shared'
import { convertThrowIntoFetchResult } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'

const appId = 'spklwebapp'
const appSecret = 'spklwebapp'

export function getAuthToken() {
  return AppLocalStorage.get(LocalStorageKeys.AuthToken)
}

/**
 * Checks for an access token in the url and tries to exchange it for a token/refresh pair.
 * @return {Promise<boolean>} true if everything is ok, otherwise throws an error.
 */
export async function checkAccessCodeAndGetTokens() {
  const accessCode = new URLSearchParams(window.location.search).get('access_code')
  if (!accessCode) return false

  const response = await getTokenFromAccessCode(accessCode)
  if (has(response, 'token')) {
    AppLocalStorage.set(LocalStorageKeys.AuthToken, response.token)
    AppLocalStorage.set(LocalStorageKeys.RefreshToken, response.refreshToken)
    return true
  }
}

/**
 * Gets the user id and sets it in localStorage
 * @param {import('@apollo/client/core').ApolloClient} apolloClient
 * @return {Promise<Object>} The full graphql response.
 */
export async function prefetchUserAndSetID(apolloClient) {
  const token = AppLocalStorage.get(LocalStorageKeys.AuthToken)
  if (!token) return

  // Pull user info (& remember it in the Apollo cache)
  const { data } = await apolloClient
    .query({
      query: mainUserDataQuery
    })
    .catch(convertThrowIntoFetchResult)

  const user = data?.activeUser
  if (user) {
    const distinctId = resolveMixpanelUserId(user.email)
    AppLocalStorage.set('distinct_id', distinctId)
    AppLocalStorage.set('uuid', user.id)
    AppLocalStorage.set('stcount', user.streams.totalCount)
    return data
  } else {
    await signOut().catch(console.error)
    throw new InvalidAuthTokenError()
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
      challenge: AppLocalStorage.get('appChallenge')
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
  const logoutBody = JSON.stringify({
    token: AppLocalStorage.get(LocalStorageKeys.AuthToken),
    refreshToken: AppLocalStorage.get(LocalStorageKeys.RefreshToken)
  })

  await fetch('/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: logoutBody
  })
    // Catching it cause we want to continue with logout even if tokens are invalid
    .catch(console.error)

  AppLocalStorage.remove(LocalStorageKeys.AuthToken)
  AppLocalStorage.remove(LocalStorageKeys.RefreshToken)
  AppLocalStorage.remove('uuid')
  AppLocalStorage.remove('distinct_id')
  AppLocalStorage.remove('stcount')
  AppLocalStorage.remove('onboarding')
  deletePostAuthRedirect()

  window.location = '/'

  if (mixpanelInstance) {
    mixpanelInstance.track('Log Out', { type: 'action' })
    mixpanelInstance.reset()
  }
}

export async function refreshToken() {
  const refreshToken = AppLocalStorage.get(LocalStorageKeys.RefreshToken)
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
    AppLocalStorage.set(LocalStorageKeys.AuthToken, data.token)
    AppLocalStorage.set(LocalStorageKeys.RefreshToken, data.refreshToken)
    await prefetchUserAndSetID()
    return true
  }
}

export function isEmailValid(email) {
  return VALID_EMAIL_REGEX.test(email)
}
