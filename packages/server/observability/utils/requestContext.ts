import { asyncRequestContextEnabled } from '@/modules/shared/helpers/envHelper'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Logger } from 'pino'

type StorageType = {
  requestId?: string
  taskId?: string
  taskName?: string
  dbMetrics: {
    totalDuration: number
    totalCount: number
  }
}

const storage = asyncRequestContextEnabled()
  ? new AsyncLocalStorage<StorageType>()
  : undefined

export const enterNewRequestContext = (params: {
  reqId?: string
  taskId?: string
  taskName?: string
}) => {
  const { reqId } = params
  const store: StorageType = {
    requestId: reqId,
    taskId: params.taskId,
    taskName: params.taskName,
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
    req: reqCtx.requestId ? { id: reqCtx.requestId } : undefined,
    taskId: reqCtx.taskId,
    taskName: reqCtx.taskName,
    dbMetrics: reqCtx.dbMetrics
  })
}
