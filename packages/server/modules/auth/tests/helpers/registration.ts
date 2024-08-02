import { getRelativeUrl } from '@speckle/shared'
import type { Express } from 'express'
import { has, isString } from 'lodash'
import request from 'supertest'

const fakeOrigin = 'http://fake.com'
export const appId = 'spklwebapp' // same values as on FE
export const appSecret = 'spklwebapp'

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

export type RequestTokenParams = {
  accessCode: string
  challenge: string
  appId?: string
  appSecret?: string
}

export const localAuthRestApi = (params: { express: Express }) => {
  const { express } = params

  const resolveErrorMessage = (res: request.Response) => {
    if (res.ok) return null

    // for some reason the error response structure differs between /login and /register...
    const body = res.body as { err?: boolean | string; message?: string }
    if (body.err) {
      const errMsg = isString(body.err)
        ? body.err
        : body.message || 'An issue occurred while resolving access code'
      return errMsg
    } else if (res.text?.length) {
      return res.text
    } else {
      return null
    }
  }

  const resolveAccessCode = async (res: request.Response): Promise<string> => {
    if (!res.redirect) {
      const errMsg = resolveErrorMessage(res)
      throw new Error(errMsg || 'Authentication request unexpectedly did not redirect')
    }

    const redirectUrl = res.header['location']
    const accessCode = new URL(redirectUrl).searchParams.get('access_code')
    if (!accessCode) {
      throw new Error('Unable to resolver access_code from auth response')
    }

    return accessCode
  }

  const registerAndGetAccessCode = async (params: RegisterParams) => {
    const { challenge, user, inviteToken, newsletter } = params

    const registerUrl = new URL(`/auth/local/register`, fakeOrigin)
    registerUrl.searchParams.append('challenge', challenge)
    if (inviteToken) {
      registerUrl.searchParams.append('token', inviteToken)
    }

    if (newsletter) {
      registerUrl.searchParams.append('newsletter', 'true')
    }

    const relativeUrl = getRelativeUrl(registerUrl)

    const res = await request(express)
      .post(relativeUrl)
      .send(user)
      .set('Content-Type', 'application/json')

    return await resolveAccessCode(res)
  }

  const getTokenFromAccessCode = async (params: RequestTokenParams) => {
    const { accessCode, challenge } = params

    const url = '/auth/token'
    const res = await request(express)
      .post(url)
      .send({
        accessCode,
        challenge,
        appId: has(params, 'appId') ? params.appId : appId,
        appSecret: has(params, 'appSecret') ? params.appSecret : appSecret
      })
      .set('Content-Type', 'application/json')

    if (!res.ok) {
      const errMsg = resolveErrorMessage(res)
      throw new Error(errMsg || 'Failed to get token from access code')
    }

    const data = res.body as { token: string; refreshToken: string }
    if (!data.token) {
      throw new Error("Couldn't resolve token through access code.")
    }

    return data.token
  }

  const authCheck = async (params: { token: string }) => {
    const query = 'query LocalAuthRestApiAuthCheck { activeUser { id email name } }'
    const res = await request(express)
      .post('/graphql')
      .set('Authorization', `Bearer ${params.token}`)
      .send({ query })

    if (!res.ok) {
      throw new Error('Failed to check auth')
    }

    const body = res.body as {
      data: { activeUser?: { id: string; name: string; email: string } }
      errors?: { message: string; extensions: Record<string, string> }[]
    }
    if (!body.data.activeUser) {
      const err = body.errors?.[0]?.message || 'Unknown issue occurred'
      throw new Error('Auth check failed: ' + err)
    }

    return body.data.activeUser
  }

  return {
    registerAndGetAccessCode,
    getTokenFromAccessCode,
    authCheck
  }
}

export type LocalAuthRestApiHelpers = ReturnType<typeof localAuthRestApi>
