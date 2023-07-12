import { isString } from 'lodash-es'
import {
  InvalidLoginParametersError,
  AuthFailedError,
  InvalidRegisterParametersError
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

type RegisterParams = {
  apiOrigin: string
  challenge: string
  inviteToken?: string
  newsletter?: boolean
  user: {
    email: string
    password: string
    name: string
    company?: string
  }
}

async function resolveAccessCode(res: Response): Promise<string> {
  if (!res.redirected) {
    // for some reason the error response structure differs between /login and /register...
    const body = (await res.json()) as { err?: boolean | string; message?: string }
    if (body.err) {
      const errMsg = isString(body.err)
        ? body.err
        : body.message || 'An issue occurred while resolving access code'
      throw new AuthFailedError(errMsg)
    }

    throw new AuthFailedError('Authentication request unexpectedly did not redirect')
  }

  const redirectUrl = res.url
  const accessCode = new URL(redirectUrl).searchParams.get('access_code')
  if (!accessCode) {
    throw new AuthFailedError('Unable to resolver access_code from auth response')
  }

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

  return { accessCode: await resolveAccessCode(res) }
}

export async function registerAndGetAccessCode(params: RegisterParams) {
  const { apiOrigin, challenge, user, inviteToken, newsletter } = params
  if (!user.email || !user.password || !user.name) {
    throw new InvalidRegisterParametersError(
      "Can't register without a valid email, password and name!"
    )
  }

  const registerUrl = new URL(`/auth/local/register`, apiOrigin)
  registerUrl.searchParams.append('challenge', challenge)
  if (inviteToken) {
    registerUrl.searchParams.append('token', inviteToken)
  }

  if (newsletter) {
    registerUrl.searchParams.append('newsletter', 'true')
  }

  const res = await fetch(registerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    body: JSON.stringify(user)
  })

  return { accessCode: await resolveAccessCode(res) }
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
    throw new AuthFailedError("Couldn't resolve token through access code.")
  }

  return data.token
}
