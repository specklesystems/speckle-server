/* eslint-disable camelcase */
import Mixpanel from 'mixpanel'
import type { IncomingHttpHeaders } from 'node:http'
import type { Optional } from '../core/helpers/utilityTypes.js'
import UAParser from 'ua-parser-js'
import { resolveMixpanelServerId } from '../core/helpers/tracking.js'

export const buildServerMixpanelClient = (params: {
  tokenId: string
  apiHostname: string
  debug?: boolean
}) => {
  const { tokenId, apiHostname, debug } = params
  const client = Mixpanel.init(tokenId, {
    host: apiHostname,
    debug
  })

  return client
}

export const buildBasePropertiesPayload = (params: {
  /**
   * Host app identifier
   */
  hostApp: string
  /**
   * The public origin (URL) of the server
   */
  serverOrigin: string
  speckleVersion: string
}) => {
  const { hostApp, serverOrigin, speckleVersion } = params

  return {
    server_id: resolveMixpanelServerId(new URL(serverOrigin).hostname),
    hostApp,
    speckleVersion
  }
}

export const buildPropertiesPayload = (params: {
  /**
   * User's distinctId. If not provided, the user will be treated as anonymous
   */
  distinctId?: string
  headers?: IncomingHttpHeaders
  query?: Record<string, unknown>
  /**
   * User's IP address from request
   */
  remoteAddress?: string
}) => {
  const { distinctId, headers, query, remoteAddress } = params

  const userProps = distinctId ? { distinct_id: distinctId } : {}

  // User agent
  const userAgentString = headers?.['user-agent'] as Optional<string>
  const uaParser = userAgentString ? new UAParser(userAgentString) : null
  const uaProps = uaParser
    ? {
        $browser: uaParser.getBrowser().name,
        $device: uaParser.getDevice().model,
        $os: uaParser.getOS().name
      }
    : {}

  // Referer
  const refererHeader = headers?.['referer'] as Optional<string>
  const refererDomain = refererHeader ? new URL(refererHeader).host : null
  const refererProps = {
    ...(refererHeader ? { $referrer: refererHeader } : {}),
    ...(refererDomain ? { $referring_domain: refererDomain } : {})
  }

  // Utm
  const utmKeys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term'
  ]
  const utmProps = utmKeys.reduce((acc, key) => {
    const value = query?.[key] as Optional<string>
    return value ? { ...acc, [key]: value } : acc
  }, {})

  // Remote addr
  const remoteAddr = (headers?.['x-forwarded-for'] as Optional<string>) || remoteAddress
  const remoteAddrProps = remoteAddr ? { ip: remoteAddr } : {}

  return {
    ...userProps,
    ...uaProps,
    ...refererProps,
    ...utmProps,
    ...remoteAddrProps
  }
}
