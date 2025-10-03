/* eslint-disable camelcase */

import crypto from 'crypto'
import { z } from 'zod'
import type { AccTokens } from '@speckle/shared/acc'
import {
  getAutodeskIntegrationClientId,
  getAutodeskIntegrationClientSecret
} from '@/modules/shared/helpers/envHelper'

interface BuildAuthorizeUrlOptions {
  clientId: string
  redirectUri: string
  codeChallenge: string
  scopes: string[]
}

interface ExchangeCodeOptions {
  code: string
  codeVerifier: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

const AccTokens = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.string(),
    id_token: z.string().optional(),
    expires_in: z.number()
  })
  .transform((data) => ({
    ...data,
    timestamp: Date.now()
  }))

export const generateCodeVerifier = () => {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return { codeVerifier, codeChallenge }
}

export const buildAuthorizeUrl = ({
  clientId,
  redirectUri,
  codeChallenge,
  scopes
}: BuildAuthorizeUrlOptions) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  return `https://developer.api.autodesk.com/authentication/v2/authorize?${params.toString()}`
}

export const exchangeCodeForTokens = async ({
  code,
  codeVerifier,
  clientId,
  clientSecret,
  redirectUri
}: ExchangeCodeOptions): Promise<AccTokens> => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier
  })

  const response = await fetch(
    'https://developer.api.autodesk.com/authentication/v2/token',
    {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  const data = await response.json()
  return AccTokens.parse(data)
}

export const exchangeRefreshTokenForTokens = async (args: {
  refresh_token: string
}): Promise<AccTokens> => {
  const clientId = getAutodeskIntegrationClientId()
  const clientSecret = getAutodeskIntegrationClientSecret()
  const token = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: args.refresh_token
  })

  const response = await fetch(
    'https://developer.api.autodesk.com/authentication/v2/token',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    }
  )

  const data = await response.json()

  return AccTokens.parse(data)
}

type AutodeskIntegrationTokenData = {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * Fetch a valid token for server-side operations as our custom integration
 */
export const getToken = async (): Promise<AutodeskIntegrationTokenData> => {
  const clientId = getAutodeskIntegrationClientId()
  const clientSecret = getAutodeskIntegrationClientSecret()

  const token = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')

  const response = await fetch(
    'https://developer.api.autodesk.com/authentication/v2/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'data:read account:read viewables:read'
      }),
      headers: {
        Authorization: `Basic ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  const data = await response.json()

  return z
    .object({
      access_token: z.string(),
      token_type: z.string(),
      expires_in: z.number()
    })
    .parse(data)
}
