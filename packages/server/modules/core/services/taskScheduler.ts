import cron from 'node-cron'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { logger } from '@/logging/logging'
import {
  AcquireTaskLock,
  ReleaseTaskLock,
  ScheduleExecution
} from '@/modules/core/domain/scheduledTasks/operations'

export const scheduledCallbackWrapper = async (
  scheduledTime: Date,
  taskName: string,
  lockTimeout: number,
  callback: (scheduledTime: Date) => Promise<void>,
  acquireLock: AcquireTaskLock,
  releaseTaskLock: ReleaseTaskLock
) => {
  const boundLogger = logger.child({ taskName })
  // try to acquire the task lock with the function name and a new expiration date
  const lockExpiresAt = new Date(scheduledTime.getTime() + lockTimeout)
  const lock = await acquireLock({ taskName, lockExpiresAt })

  // if couldn't acquire it, stop execution
  if (!lock) {
    boundLogger.warn(`Could not acquire task lock for ${taskName}, stopping execution.`)
    return
  }
  try {
    // else continue executing the callback...
    boundLogger.info(`Executing scheduled function ${taskName} at ${scheduledTime}`)
    await callback(scheduledTime)
    // update lock as succeeded
    const finishDate = new Date()
    boundLogger.info(
      `Finished scheduled function ${taskName} execution in ${
        (finishDate.getTime() - scheduledTime.getTime()) / 1000
      } seconds`
    )
  } catch (error) {
    boundLogger.error(
      error,
      `The triggered task execution ${taskName} failed at ${scheduledTime}, with error ${
        ensureError(error, 'unknown reason').message
      }`
    )
  } finally {
    releaseTaskLock(lock)
  }
}

export const scheduleExecutionFactory =
  ({
    acquireTaskLock,
    releaseTaskLock
  }: {
    acquireTaskLock: AcquireTaskLock
    releaseTaskLock: ReleaseTaskLock
  }): ScheduleExecution =>
  (
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
        acquireTaskLock,
        releaseTaskLock
      )
    })
  }
