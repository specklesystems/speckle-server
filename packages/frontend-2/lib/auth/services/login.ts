import { ApolloClient } from '@apollo/client/core'
import {
  InvalidLoginParametersError,
  LoginFailedError
} from '~~/lib/auth/errors/errors'
import { LogicError } from '~~/lib/core/errors/base'

// TODO: Should these differ from the old frontend values?
const appId = 'spklwebapp'
const appSecret = 'spklwebapp'

type AccessCodeResponse = {
  accessCode?: string
}

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

function resolveAccessCode(body: AccessCodeResponse): string {
  const accessCode = body?.accessCode
  if (!accessCode) {
    throw new LoginFailedError(
      'Invalid email/password (unable to resolve access_code from redirect url).'
    )
  }

  return accessCode
}

async function getAccessCode(params: LoginParams) {
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

  const body = (await res.json()) as AccessCodeResponse

  return resolveAccessCode(body)
}

async function getTokenFromAccessCode(params: TokenParams) {
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

// TODO: Re-introduce way to redirect user to page X post-login

export async function login(params: LoginParams): Promise<string> {
  if (process.server) {
    throw new LogicError('Logging in during SSR is not supported!')
  }

  const { apiOrigin, challenge } = params

  const accessCode = await getAccessCode(params)
  return await getTokenFromAccessCode({ accessCode, apiOrigin, challenge })
}

/**
 * Evict cache that depends on auth state (e.g. 'me' query)
 */
export function resetAuthState(client: ApolloClient<unknown>) {
  client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'activeUser' })
}
