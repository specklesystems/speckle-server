import cron from 'node-cron'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { activitiesLogger } from '@/logging/logging'
import {
  AcquireTaskLock,
  ScheduleExecution
} from '@/modules/core/domain/scheduledTasks/operations'

export const scheduledCallbackWrapper = async (
  scheduledTime: Date,
  taskName: string,
  lockTimeout: number,
  callback: (scheduledTime: Date) => Promise<void>,
  acquireLock: AcquireTaskLock
) => {
  const boundLogger = activitiesLogger.child({ taskName })
  // try to acquire the task lock with the function name and a new expiration date
  const lockExpiresAt = new Date(scheduledTime.getTime() + lockTimeout)
  try {
    const lock = await acquireLock({ taskName, lockExpiresAt })

    // if couldn't acquire it, stop execution
    if (!lock) {
      boundLogger.warn(
        `Could not acquire task lock for ${taskName}, stopping execution.`
      )
      return null
    }

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
  }
}

export const scheduleExecutionFactory =
  (deps: { acquireTaskLock: AcquireTaskLock }): ScheduleExecution =>
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
        deps.acquireTaskLock
      )
    })
  }
