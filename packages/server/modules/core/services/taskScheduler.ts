import cron from 'node-cron'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { modulesDebug, errorDebug } from '@/modules/shared/utils/logger'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { acquireTaskLock } from '@/modules/core/repositories/scheduledTasks'
import { ScheduledTaskRecord } from '@/modules/core/helpers/types'

const activitiesDebug = modulesDebug.extend('activities')

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
  const lock = await acquireLock({ taskName, lockExpiresAt })

  // if couldn't acquire it, stop execution
  if (!lock) {
    activitiesDebug(`Could not acquire task lock for ${taskName}, stopping execution.`)
    return null
  }

  // else continue executing the callback...
  activitiesDebug(`Executing scheduled function ${taskName} at ${scheduledTime}`)
  try {
    await callback(scheduledTime)
    // update lock as succeeded
    const finishDate = new Date()
    activitiesDebug(
      `Finished scheduled function ${taskName} execution in ${
        (finishDate.getTime() - scheduledTime.getTime()) / 1000
      } seconds`
    )
  } catch (error) {
    errorDebug(
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
