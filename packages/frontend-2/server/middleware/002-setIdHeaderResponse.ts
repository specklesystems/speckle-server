import { defineEventHandler, fromNodeMiddleware } from 'h3'
import type { IncomingMessage, ServerResponse } from 'http'
import { REQUEST_ID_HEADER } from '~~/server/lib/core/helpers/constants'

export const getRequestIdMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => {
  // we are the ones who are pushing the req.id there, so we know its a string
  res.setHeader(REQUEST_ID_HEADER, `${req.id as string}`)
  next()
}

export default defineEventHandler(fromNodeMiddleware(getRequestIdMiddleware))
