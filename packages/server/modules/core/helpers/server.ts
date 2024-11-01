import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { Request } from 'express'
import type { IncomingMessage } from 'http'
import { get } from 'lodash'
import { parse } from 'url'

export const getRequestPath = (req: IncomingMessage | Request) => {
  const maybeUrl = get(req, 'originalUrl') || get(req, 'url') || ('' as string)
  const url = new URL(maybeUrl, getServerOrigin())
  const path = url.pathname
  if (!path || !path.length) return null
  if (path === '/') return null

  return path
}

export const getRequestParameters = (req: IncomingMessage | Request) => {
  const maybeUrl = get(req, 'originalUrl') || get(req, 'url') || ''
  const url = parse(maybeUrl, true)
  return url.query || {}
}
