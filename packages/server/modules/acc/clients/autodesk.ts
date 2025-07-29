/* eslint-disable camelcase */

import type {
  AccRegion,
  ModelDerivativeServiceDesignManifest
} from '@/modules/acc/domain/types'
import {
  getAutodeskIntegrationClientId,
  getAutodeskIntegrationClientSecret
} from '@/modules/shared/helpers/envHelper'
import { logger } from '@/observability/logging'
import { z } from 'zod'

const invokeJsonRequest = async <T>(params: {
  url: string
  token: string
  method?: RequestInit['method']
  body?: URLSearchParams | Record<string, unknown>
  headers?: Record<string, string>
}) => {
  const { url, method = 'get', body = {}, headers = {}, token } = params

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type':
        body instanceof URLSearchParams
          ? 'application/x-www-form-urlencoded'
          : 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers
    },
    body: body && body instanceof URLSearchParams ? body : JSON.stringify(body)
  })

  return (await response.json()) as T
}

type AutodeskIntegrationTokenData = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

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
      refresh_token: z.string(),
      token_type: z.string(),
      expires_in: z.number()
    })
    .parse(data)
}

/**
 * Get base Autodesk API endpoint for a given region.
 * NOTE: This has been true for all endpoints used so far but should be validated for any new ones!
 */
const getRegionUrl = (region: AccRegion): string => {
  switch (region) {
    case 'EMEA':
      return 'https://developer.api.autodesk.com/modelderivative/v2/regions/eu'
    default:
      return 'https://developer.api.autodesk.com/modelderivative/v2'
  }
}

const getApiUrl = (path: string, region: AccRegion): string => {
  return `${getRegionUrl(region)}${path}`
}

/**
 * Encode a urn string in the modified url-safe base64 format expected by the Autodesk API
 */
const encodeUrn = (urn: string): string => {
  return btoa(urn).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

type AccWebhookConfig = {
  // The (unencoded) ACC folder urn to subscribe to. Event will fire for all files in this folder.
  rootProjectFolderUrn: string
  // The Speckle endpoint to hit when the given event fires.
  callbackUrl: string
  // The ACC webhook event to subscribe to. You can register an event to a given callback url only once.
  event: 'dm.version.added'
  // The region where the request is executed
  region: AccRegion
}

/**
 * Register relevant webhook callbacks for integration with a given ACC project.
 * @see https://aps.autodesk.com/en/docs/webhooks/v1/reference/http/webhooks/systems-system-events-event-hooks-POST/
 * @returns null if webhook already exists
 */
export const tryRegisterAccWebhook = async (
  webhook: AccWebhookConfig
): Promise<string | null> => {
  const { rootProjectFolderUrn, callbackUrl, event, region } = webhook

  const tokenData = await getToken()

  const response = await fetch(
    `https://developer.api.autodesk.com/webhooks/v1/systems/data/events/${event}/hooks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'x-ads-region': region
      },
      body: JSON.stringify({
        callbackUrl,
        scope: {
          folder: rootProjectFolderUrn
        }
      })
    }
  )

  if (response.ok && response.status === 201) {
    const webhookId = response.headers.get('Location')?.split('/').at(-1)

    if (!webhookId) {
      logger.info({ location: response.headers.get('Location') })
      throw new Error('Webhook created but failed to parse id')
    }
  }

  const e = await response.json().catch(() => null)

  const isConflict =
    response.status === 409 &&
    e?.code === 'CONFLICT_ERROR' &&
    e?.detail?.includes('Failed to save duplicate webhooks scope')

  if (isConflict) {
    logger.warn('Webhook already exists. Skipping registration.')
    return null
  }

  throw new Error(`Webhook registration failed: ${JSON.stringify(e, null, 2)}`)
}

/**
 * Get a manifest of the available derivative assets for a given design urn
 * @see https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/manifest/urn-manifest-GET/
 */
export const getManifestByUrn = async (
  params: {
    urn: string
    region: AccRegion
  },
  context: {
    token: string
  }
): Promise<ModelDerivativeServiceDesignManifest> => {
  const { urn, region = 'EMEA' } = params
  const { token } = context

  const encodedUrn = encodeUrn(urn)

  const url = getApiUrl(`/designdata/${encodedUrn}/manifest`, region)

  return await invokeJsonRequest({
    url,
    token,
    method: 'GET'
  })
}
