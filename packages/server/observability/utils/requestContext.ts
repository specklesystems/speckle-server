import { asyncRequestContextEnabled } from '@/modules/shared/helpers/envHelper'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Logger } from '@/observability/logging'

type StorageTypeBase = {
  dbMetrics: {
    totalDuration: number
    totalCount: number
  }
  logger: Logger
}
type RequestStorageType = { requestId: string } & StorageTypeBase
type TaskStorageType = { taskId: string; taskName: string } & StorageTypeBase

type StorageType = RequestStorageType | TaskStorageType

export const isRequestContext = (store: unknown): store is RequestStorageType => {
  return typeof store === 'object' && store !== null && 'requestId' in store
}
export const isTaskContext = (store: unknown): store is TaskStorageType => {
  return (
    typeof store === 'object' &&
    store !== null &&
    'taskId' in store &&
    'taskName' in store
  )
}

const storage = asyncRequestContextEnabled()
  ? new AsyncLocalStorage<StorageType>()
  : undefined

export const enterNewRequestContext = (
  params: ({ reqId: string } | { taskId: string; taskName: string }) & {
    logger: Logger
  }
) => {
  const { logger } = params
  const base: StorageTypeBase = {
    dbMetrics: {
      totalCount: 0,
      totalDuration: 0
    },
    logger
  }
  if ('reqId' in params) {
    const store: RequestStorageType = {
      ...base,
      requestId: params.reqId
    }
    storage?.enterWith(store)
  } else if ('taskId' in params) {
    const store: TaskStorageType = {
      ...base,
      taskId: params.taskId,
      taskName: params.taskName
    }
    storage?.enterWith(store)
  }
}

export const getRequestContext = () => storage?.getStore()
export const getRequestLogger = () => getRequestContext()?.logger

export const loggerWithMaybeContext = ({ logger }: { logger: Logger }) => {
  const reqCtx = getRequestContext()
  if (!reqCtx) return logger

  if (isTaskContext(reqCtx)) {
    return logger.child({
      taskId: reqCtx.taskId,
      taskName: reqCtx.taskName,
      dbMetrics: reqCtx.dbMetrics
    })
  }

  if (isRequestContext(reqCtx)) {
    return logger.child({
      req: reqCtx.requestId ? { id: reqCtx.requestId } : undefined,
      dbMetrics: reqCtx.dbMetrics
    })
  }
  return logger
}
