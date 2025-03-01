import { REQUEST_ID_HEADER } from '@/observability/components/express/expressLogging'
import { asyncRequestContextEnabled } from '@/modules/shared/helpers/envHelper'
import type express from 'express'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Logger } from 'pino'

type StorageType = {
  requestId: string
  dbMetrics: {
    totalDuration: number
    totalCount: number
  }
}

const storage = asyncRequestContextEnabled()
  ? new AsyncLocalStorage<StorageType>()
  : undefined

export const initiateRequestContextMiddleware: express.RequestHandler = (
  req,
  _res,
  next
) => {
  const reqId = req.id || req.headers[REQUEST_ID_HEADER] || 'unknown'
  enterNewRequestContext({ reqId: reqId as string })
  next()
}

export const enterNewRequestContext = (params: { reqId: string }) => {
  const { reqId } = params
  const store: StorageType = {
    requestId: reqId,
    dbMetrics: {
      totalCount: 0,
      totalDuration: 0
    }
  }
  storage?.enterWith(store)
}

export const getRequestContext = () => storage?.getStore()

export const loggerWithMaybeContext = ({ logger }: { logger: Logger }) => {
  const reqCtx = getRequestContext()
  if (!reqCtx) return logger
  return logger.child({
    req: { id: reqCtx.requestId },
    dbMetrics: reqCtx.dbMetrics
  })
}
