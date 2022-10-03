import cron from 'node-cron'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { modulesDebug, errorDebug } from '@/modules/shared/utils/logger'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import {
  getLastScheduledTask,
  saveScheduledTask
} from '@/modules/core/repositories/scheduledTasks'
import { ScheduledTaskRecord } from '@/modules/core/helpers/types'

const activitiesDebug = modulesDebug.extend('activities')

export const isTaskLocked = (
  scheduledTask: ScheduledTaskRecord,
  now: Date
): [boolean, number] => {
  // This is using time based lock release configured on a per task instance basis.
  // this makes sure if the task completes very quick, before other try to access the lock
  // that the execution of the given scheduled task is still blocked for the lockTimeout
  // time period
  const lockPeriod = scheduledTask.lockTimeout
  const timeDelta = now.getTime() - scheduledTask.updatedAt.getTime()
  return [timeDelta < lockPeriod, lockPeriod - timeDelta]
}

export const scheduledCallbackWrapper = async (
  now: Date,
  taskName: string,
  lockTimeout: number,
  callback: (now: Date) => Promise<void>
) => {
  // lock should be: taskName, date with seconds only? precision, job state -> locked/executing, failed, succeeded, free?
  const currentTask = {
    taskName,
    createdAt: now,
    updatedAt: now,
    status: 1,
    lockTimeout
  }

  try {
    const lastScheduledTask = await getLastScheduledTask(taskName)
    if (lastScheduledTask) {
      const [taskLocked, lockExpiration] = isTaskLocked(lastScheduledTask, now)

      if (taskLocked) {
        activitiesDebug(
          `Scheduled function ${taskName}'s execution lock is valid for another ${
            lockExpiration / 1000
          } seconds. Not executing current trigger`
        )
        return
      }
    }

    // else continue execution...
    activitiesDebug(`Executing scheduled function ${taskName} at ${now}`)
    // lock the database with the function name
    await saveScheduledTask(currentTask)
    await callback(now)
    // update lock as succeeded
    const finishDate = new Date()
    currentTask.status = 0
    currentTask.updatedAt = finishDate
    await saveScheduledTask(currentTask)
    activitiesDebug(
      `Finished scheduled function ${taskName} execution in ${
        (finishDate.getTime() - now.getTime()) / 1000
      } seconds`
    )
  } catch (error) {
    // update lock as failed
    const finishDate = new Date()
    currentTask.status = 2
    currentTask.updatedAt = finishDate
    await saveScheduledTask(currentTask)
    errorDebug(
      `The triggered task execution ${taskName} failed at ${now}, with error ${
        ensureError(error, 'unknown reason').message
      }`
    )
  }
}

export const scheduleExecution = (
  cronExpression: string,
  taskName: string,
  lockTimeout: number,
  callback: (now: Date) => Promise<void>
): cron.ScheduledTask => {
  const expressionValid = cron.validate(cronExpression)
  if (!expressionValid)
    throw new InvalidArgumentError(
      `The given cron expression ${cronExpression} is not valid`
    )
  return cron.schedule(cronExpression, async (now: Date) => {
    await scheduledCallbackWrapper(now, taskName, lockTimeout, callback)
  })
}
