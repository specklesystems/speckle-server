import { SafeLocalStorage } from '@speckle/shared'
import {
  InvalidLoginParametersError,
  LoginFailedError
} from '~~/lib/auth/errors/errors'
import { LocalStorageKeys } from '~~/lib/common/helpers/constants'

// TODO: Should these differ from the old frontend values?
const appId = 'spklwebapp'
const appSecret = 'spklwebapp'

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
    throw new LoginFailedError('Response did not return a redirect status code')
  }

  const accessCode = new URL(res.url).searchParams.get('access_code')
  if (!accessCode) {
    throw new LoginFailedError('Unable to resolve access_code from redirect url')
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

  if (!res.redirected) {
    const data = (await res.json()) as Record<string, unknown> &
      Partial<{ err: boolean; message: string }>
    if (data.err && data.message) {
      throw new LoginFailedError(data.message)
    } else {
      throw new LoginFailedError()
    }
  }

  return resolveAccessCode(res)
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
    throw new LoginFailedError("Couldn't resolve token through access code!")
  }

  return data.token
}

export async function login(params: LoginParams) {
  const { apiOrigin, challenge } = params

  const accessCode = await getAccessCode(params)
  const token = await getTokenFromAccessCode({ accessCode, apiOrigin, challenge })

  SafeLocalStorage.set(LocalStorageKeys.AuthToken, token)

  // reload page & go to index
  window.location.href = '/'
}
