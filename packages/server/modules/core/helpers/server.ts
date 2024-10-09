import type { Request } from 'express'
import type { IncomingMessage } from 'http'
import { get } from 'lodash'

export const getRequestPath = (req: IncomingMessage | Request) => {
  const path = ((get(req, 'originalUrl') || get(req, 'url') || '') as string).split(
    '?'
  )[0]
  return path?.length ? path : null
}
