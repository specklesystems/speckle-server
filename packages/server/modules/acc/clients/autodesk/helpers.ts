import type { AccRegion } from '@/modules/acc/domain/acc/constants'
import { AccRegions } from '@/modules/acc/domain/acc/constants'
import { AutodeskApiRequestError } from '@/modules/acc/errors/acc'
import { logger } from '@/observability/logging'

export const invokeJsonRequest = async <T>(params: {
  url: string
  token: string
  method?: RequestInit['method']
  body?: string
  headers?: Record<string, string>
}) => {
  const { url, method = 'get', body, headers = {}, token } = params

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers
      },
      body
    })

    return (await response.json()) as T
  } catch (e) {
    logger.error(
      {
        ...params,
        error: e
      },
      'Autodesk request failed'
    )
    throw new AutodeskApiRequestError(method, url)
  }
}

/**
 * Get base Autodesk API endpoint for a given region.
 * NOTE: This has been true for all endpoints used so far but should be validated for any new ones!
 */
export const getRegionUrl = (region: AccRegion): string => {
  switch (region) {
    case AccRegions.EMEA:
      return 'https://developer.api.autodesk.com/modelderivative/v2/regions/eu'
    default:
      return 'https://developer.api.autodesk.com/modelderivative/v2'
  }
}

export const getApiUrl = (path: string, region: AccRegion): string => {
  return `${getRegionUrl(region)}${path}`
}

/**
 * Encode a urn string in the modified url-safe base64 format expected by the Autodesk API
 */
export const encodeUrn = (urn: string): string => {
  return btoa(urn).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
