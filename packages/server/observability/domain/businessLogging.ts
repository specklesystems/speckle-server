import type { Logger } from '@/observability/logging'
import {
  OperationLogLinePrefix,
  OperationName,
  OperationStatus
} from '@/observability/domain/fields'
import { logWithErr } from '@/observability/utils/logLevels'

export const logErrorThenThrow = (err: unknown, logger: Logger) => {
  logWithErr(logger, err, OperationStatus.failure, OperationLogLinePrefix)
  throw err
}

export const withOperationLogging = <T>(
  operation: T,
  params: {
    logger: Logger
    operationName: string
    operationDescription?: string
    errorHandler?: (err: unknown, logger: Logger) => unknown
  }
): T | void => {
  const { operationName, operationDescription } = params
  const errorHandler = params.errorHandler || logErrorThenThrow
  const logger = params.logger.child(OperationName(operationName))

  try {
    logger.info(
      OperationStatus.start,
      `${OperationLogLinePrefix}${
        operationDescription ? ` ${operationDescription}` : ''
      }`
    )
    const results = operation
    logger.info(OperationStatus.success, OperationLogLinePrefix)
    return results
  } catch (err) {
    errorHandler(err, logger)
  }
}
