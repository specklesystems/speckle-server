import cron from 'node-cron'
import crs from 'crypto-random-string'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { type Logger, taskSchedulerLogger as logger } from '@/observability/logging'
import type {
  AcquireTaskLock,
  ReleaseTaskLock,
  ScheduleExecution
} from '@/modules/core/domain/scheduledTasks/operations'
import { enterNewRequestContext } from '@/observability/utils/requestContext'
import { TIME_MS } from '@speckle/shared'

export const scheduledCallbackWrapper = async (
  scheduledTime: Date,
  taskName: string,
  lockTimeout: number,
  callback: (scheduledTime: Date, context: { logger: Logger }) => Promise<void>,
  acquireLock: AcquireTaskLock,
  releaseTaskLock: ReleaseTaskLock
) => {
  const taskId = crs({ length: 10 })
  const boundLogger = logger.child({ taskName, taskId })
  enterNewRequestContext({ taskId, taskName, logger: boundLogger })
  // try to acquire the task lock with the function name and a new expiration date
  const lockExpiresAt = new Date(scheduledTime.getTime() + lockTimeout)
  const lock = await acquireLock({ taskName, lockExpiresAt })

  // if couldn't acquire it, stop execution
  if (!lock) {
    boundLogger.info('Could not acquire task lock for {taskName}, stopping execution.')
    return
  }
  try {
    // else continue executing the callback...
    boundLogger.debug(
      { scheduledTime },
      'Executing scheduled function {taskName} at {scheduledTime}'
    )
    await callback(scheduledTime, { logger: boundLogger })
    // update lock as succeeded
    const finishDate = new Date()
    boundLogger.debug(
      {
        durationSeconds:
          (finishDate.getTime() - scheduledTime.getTime()) / TIME_MS.second
      },
      'Finished scheduled function {taskName} execution succeeded in {durationSeconds} seconds'
    )
  } catch (error) {
    boundLogger.error(
      { err: error, scheduledTime },
      'The triggered task execution {taskName} failed at {scheduledTime}'
    )
  } finally {
    await releaseTaskLock(lock)
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
    lockTimeout = 1 * TIME_MS.minute
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
