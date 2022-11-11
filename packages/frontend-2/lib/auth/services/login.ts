import { ApolloClient } from '@apollo/client/core'
import {
  InvalidLoginParametersError,
  LoginFailedError
} from '~~/lib/auth/errors/errors'
import { speckleWebAppId } from '~~/lib/auth/helpers/strategies'

// TODO: Should these differ from the old frontend values?
const appId = speckleWebAppId
const appSecret = speckleWebAppId

type LoginParams = {
  apiOrigin: string
  email: string
  password: string
  challenge: string
}

type TokenParams = {
  accessCode: string
  apiOrigin: string
  challenge: string
}

function resolveAccessCode(res: Response): string {
  if (!res.redirected) {
    throw new LoginFailedError('Authentication request unexpectedly did not redirect')
  }

  const redirectUrl = res.url
  const accessCode = new URL(redirectUrl).searchParams.get('access_code')
  if (!accessCode) {
    throw new LoginFailedError('Unable to resolver access_code from auth response')
  }

  // TODO: Re-introduce post login redirect (url coming from server or from client)

  return accessCode
}

export async function getAccessCode(params: LoginParams) {
  const { apiOrigin, email, password, challenge } = params

  if (!email || !password) {
    throw new InvalidLoginParametersError(
      "Can't log in without a valid email and password!"
    )
  }

  const loginUrl = new URL(
    `/auth/local/login?challenge=${challenge}`,
    apiOrigin
  ).toString()

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    body: JSON.stringify({ email, password })
  })

  return { accessCode: resolveAccessCode(res) }
}

export async function getTokenFromAccessCode(params: TokenParams) {
  const { apiOrigin, accessCode, challenge } = params

  const url = new URL('/auth/token', apiOrigin)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      accessCode,
      appId,
      appSecret,
      challenge
    })
  })

  // TODO: Do we wanna start using refresh tokens?
  const data = (await response.json()) as { token: string; refreshToken: string }
  if (!data.token) {
    throw new LoginFailedError("Couldn't resolve token through access code.")
  }

  return data.token
}

/**
 * Evict cache that depends on auth state (e.g. 'me' query)
 */
export function resetAuthState(client: ApolloClient<unknown>) {
  client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeUser' })
}
