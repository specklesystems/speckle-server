import { REQUEST_ID_HEADER } from '@/observability/components/express/expressLogging'
import { enterNewRequestContext } from '@/observability/utils/requestContext'
import type express from 'express'

export const initiateRequestContextMiddleware: express.RequestHandler = (
  req,
  _res,
  next
) => {
  const reqId = req.id || req.headers[REQUEST_ID_HEADER] || 'unknown'
  enterNewRequestContext({ reqId: reqId as string })
  next()
}
