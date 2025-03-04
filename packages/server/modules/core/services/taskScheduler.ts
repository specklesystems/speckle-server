import cron from 'node-cron'
import crs from 'crypto-random-string'
import crs from 'crypto-random-string'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { type Logger, taskSchedulerLogger as logger } from '@/observability/logging'
import {
  AcquireTaskLock,
  ReleaseTaskLock,
  ScheduleExecution
} from '@/modules/core/domain/scheduledTasks/operations'
import { enterNewRequestContext } from '@/observability/utils/requestContext'

export const scheduledCallbackWrapper = async (
  scheduledTime: Date,
  taskName: string,
  lockTimeout: number,
  callback: (scheduledTime: Date, context: { logger: Logger }) => Promise<void>,
  callback: (scheduledTime: Date, context: { logger: Logger }) => Promise<void>,
  acquireLock: AcquireTaskLock,
  releaseTaskLock: ReleaseTaskLock
) => {
  const taskId = crs({ length: 10 })
  const boundLogger = logger.child({ taskName, taskId })
  enterNewRequestContext({ taskId, taskName })
  // try to acquire the task lock with the function name and a new expiration date
  const lockExpiresAt = new Date(scheduledTime.getTime() + lockTimeout)
  const lock = await acquireLock({ taskName, lockExpiresAt })

  // if couldn't acquire it, stop execution
  if (!lock) {
    boundLogger.warn('Could not acquire task lock for {taskName}, stopping execution.')
    return
  }
  try {
    // else continue executing the callback...
    boundLogger.info(
      { scheduledTime },
      'Executing scheduled function {taskName} at {scheduledTime}'
    )
    await callback(scheduledTime, { logger: boundLogger })
    // update lock as succeeded
    const finishDate = new Date()
    boundLogger.info(
      { durationSeconds: (finishDate.getTime() - scheduledTime.getTime()) / 1000 },
      'Finished scheduled function {taskName} execution in {durationSeconds} seconds'
    )
  } catch (error) {
    boundLogger.error(
      { err: error, scheduledTime },
      'The triggered task execution {taskName} failed at {scheduledTime}'
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
    callback: (scheduledTime: Date, context: { logger: Logger }) => Promise<void>,
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
