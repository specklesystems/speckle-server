import cron from 'node-cron'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { acquireTaskLock } from '@/modules/core/repositories/scheduledTasks'
import { ScheduledTaskRecord } from '@/modules/core/helpers/types'
import { activitiesLogger, logger } from '@/logging/logging'

export const scheduledCallbackWrapper = async (
  scheduledTime: Date,
  taskName: string,
  lockTimeout: number,
  callback: (scheduledTime: Date) => Promise<void>,
  acquireLock: (
    scheduledTask: ScheduledTaskRecord
  ) => Promise<ScheduledTaskRecord | null>
) => {
  // try to acquire the task lock with the function name and a new expiration date
  const lockExpiresAt = new Date(scheduledTime.getTime() + lockTimeout)
  try {
    const lock = await acquireLock({ taskName, lockExpiresAt })

    // if couldn't acquire it, stop execution
    if (!lock) {
      activitiesLogger.warn(
        `Could not acquire task lock for ${taskName}, stopping execution.`
      )
      return null
    }

    // else continue executing the callback...
    activitiesLogger.info(
      `Executing scheduled function ${taskName} at ${scheduledTime}`
    )
    await callback(scheduledTime)
    // update lock as succeeded
    const finishDate = new Date()
    activitiesLogger.info(
      `Finished scheduled function ${taskName} execution in ${
        (finishDate.getTime() - scheduledTime.getTime()) / 1000
      } seconds`
    )
  } catch (error) {
    logger.error(
      `The triggered task execution ${taskName} failed at ${scheduledTime}, with error ${
        ensureError(error, 'unknown reason').message
      }`
    )
  }
}

export const scheduleExecution = (
  cronExpression: string,
  taskName: string,
  callback: (scheduledTime: Date) => Promise<void>,
  lockTimeout = 60 * 1000
): cron.ScheduledTask => {
  const expressionValid = cron.validate(cronExpression)
  if (!expressionValid)
    throw new InvalidArgumentError(
      `The given cron expression ${cronExpression} is not valid`
    )
  return cron.schedule(cronExpression, async (scheduledTime: Date) => {
    await scheduledCallbackWrapper(
      scheduledTime,
      taskName,
      lockTimeout,
      callback,
      acquireTaskLock
    )
  })
}
