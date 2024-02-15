import type { IncomingMessage } from 'http'
import type express from 'express'
import { get } from 'lodash'

export const getRequestPath = (req: IncomingMessage | express.Request) => {
  const path = (get(req, 'originalUrl') || get(req, 'url') || '').split(
    '?'
  )[0] as string
  return path?.length ? path : null
}
