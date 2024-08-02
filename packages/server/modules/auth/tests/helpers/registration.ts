import type { Express } from 'express'
import { isString } from 'lodash'
import request from 'supertest'

const fakeOrigin = 'http://fake.com'

export type RegisterParams = {
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

export const localAuthRestApi = (params: { express: Express }) => {
  const { express } = params

  const resolveAccessCode = async (res: request.Response): Promise<string> => {
    if (!res.redirect) {
      // for some reason the error response structure differs between /login and /register...
      const body = res.body as { err?: boolean | string; message?: string }
      if (body.err) {
        const errMsg = isString(body.err)
          ? body.err
          : body.message || 'An issue occurred while resolving access code'
        throw new Error(errMsg)
      }

      throw new Error('Authentication request unexpectedly did not redirect')
    }

    const redirectUrl = res.xhr
    const accessCode = new URL(redirectUrl).searchParams.get('access_code')
    if (!accessCode) {
      throw new Error('Unable to resolver access_code from auth response')
    }

    return accessCode
  }

  const registerAndGetAccessCode = async (params: RegisterParams) => {
    const { challenge, user, inviteToken, newsletter } = params
    if (!user.email || !user.password || !user.name) {
      throw new Error("Can't register without a valid email, password and name!")
    }

    const registerUrl = new URL(`/auth/local/register`, fakeOrigin)
    registerUrl.searchParams.append('challenge', challenge)
    if (inviteToken) {
      registerUrl.searchParams.append('token', inviteToken)
    }

    if (newsletter) {
      registerUrl.searchParams.append('newsletter', 'true')
    }

    const relativeUrl = registerUrl.pathname + registerUrl.search

    // POST against express instance
    const res = await request(express)
      .post(relativeUrl)
      .send(user)
      .set('Content-Type', 'application/json')

    return await resolveAccessCode(res)
  }

  return {
    registerAndGetAccessCode
  }
}

export type LocalAuthRestApiHelpers = ReturnType<typeof localAuthRestApi>
