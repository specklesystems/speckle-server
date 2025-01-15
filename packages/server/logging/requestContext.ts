import { REQUEST_ID_HEADER } from '@/logging/expressLogging'
import { asyncRequestContextEnabled } from '@/modules/shared/helpers/envHelper'
import type express from 'express'
import { AsyncLocalStorage } from 'node:async_hooks'

type StorageType = {
  requestId: string
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
  const store: StorageType = { requestId: reqId as string }
  storage?.enterWith(store)
  next()
}

export const getRequestContext = () => storage?.getStore()
