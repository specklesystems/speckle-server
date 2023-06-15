import cron from 'node-cron'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { acquireTaskLock } from '@/modules/core/repositories/scheduledTasks'
import { ScheduledTaskRecord } from '@/modules/core/helpers/types'
import { activitiesLogger } from '@/logging/logging'

export const scheduledCallbackWrapper = async (
  scheduledTime: Date | 'init' | 'manual',
  taskName: string,
  lockTimeout: number,
  callback: (scheduledTime: Date) => Promise<void>,
  acquireLock: (
    scheduledTask: ScheduledTaskRecord
  ) => Promise<ScheduledTaskRecord | null>
) => {
  const boundLogger = activitiesLogger.child({ taskName })

  let triggeredDate = Date.now()
  if (scheduledTime !== 'init' && scheduledTime !== 'manual') {
    triggeredDate = scheduledTime.getTime()
  }

  // try to acquire the task lock with the function name and a new expiration date
  const lockExpiresAt = new Date(triggeredDate + lockTimeout)
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
    boundLogger.info(
      `Executing scheduled function ${taskName} at ${new Date(triggeredDate)}`
    )
    await callback(new Date(triggeredDate))
    // update lock as succeeded
    const finishDate = new Date()
    boundLogger.info(
      `Finished scheduled function ${taskName} execution in ${
        (finishDate.getTime() - triggeredDate) / 1000
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
  return cron.schedule(
    cronExpression,
    async (scheduledTime: Date | 'init' | 'manual') => {
      await scheduledCallbackWrapper(
        scheduledTime,
        taskName,
        lockTimeout,
        callback,
        acquireTaskLock
      )
    }
  )
}
