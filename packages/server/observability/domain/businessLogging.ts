import type { Logger } from '@/observability/logging'
import {
  OperationLogLinePrefix,
  OperationName,
  OperationStatus
} from '@/observability/domain/fields'
import { logWithErr } from '@/observability/utils/logLevels'

/**
 * @description withOperationLogging is intended to be used for adding observability to high-level 'business' operations
 * (e.g. creating a new object, sending an email, etc). It will log the start and end of the operation, as well as any errors that occur.
 * It is likely to only be called directly within mutation Graphql resolvers and POST/PUT/DELETE REST endpoints.
 * @param operation
 * @param params
 * @returns Returns the result of the operation
 */
export const withOperationLogging = async <T>(
  operation: () => T,
  params: {
    logger: Logger
    operationName: string
    operationDescription?: string
  }
): Promise<T> => {
  const { operationName, operationDescription } = params
  const logger = params.logger.child(OperationName(operationName))

  try {
    logger.info(
      { ...OperationStatus.start, operationDescription },
      `${OperationLogLinePrefix}${
        operationDescription ? ' {operationDescription}' : ''
      }`
    )
    const results = await operation()
    logger.info(OperationStatus.success, OperationLogLinePrefix)
    return results
  } catch (err) {
    logWithErr(logger, err, OperationStatus.failure, OperationLogLinePrefix)
    throw err
  }
}
