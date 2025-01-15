import { REQUEST_ID_HEADER } from '@/logging/expressLogging'
import { asyncRequestContextEnabled } from '@/modules/shared/helpers/envHelper'
import type express from 'express'
import { AsyncLocalStorage } from 'node:async_hooks'

type StorageType = {
  requestId: string
  dbMetrics: {
    totalDuration: number
    totalCount: number
    queries: string[]
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
  const reqId = req.headers[REQUEST_ID_HEADER] || 'unknown'
  const store: StorageType = {
    requestId: reqId as string,
    dbMetrics: {
      totalCount: 0,
      totalDuration: 0,
      queries: []
    }
  }
  storage?.enterWith(store)
  next()
}

export const getRequestContext = () => storage?.getStore()
