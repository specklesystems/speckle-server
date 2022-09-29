import cron from 'node-cron'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { modulesDebug, errorDebug } from '@/modules/shared/utils/logger'
import { ensureError } from '@/modules/shared/helpers/errorHelper'

const activitiesDebug = modulesDebug.extend('activities')

export const scheduleExecution = (
  cronExpression: string,
  functionName: string,
  callback: (now: Date) => Promise<void>
): cron.ScheduledTask => {
  const expressionValid = cron.validate(cronExpression)
  if (!expressionValid)
    throw new InvalidArgumentError(
      `The given cron expression ${cronExpression} is not valid`
    )

  return cron.schedule(cronExpression, async (now: Date) => {
    try {
      // check the database for locks given the now Date with some precision tolerance and the functionName
      // if locked log it:
      // activitiesDebug(`Scheduled function ${functionName} is already being executed`)
      // and just return

      // else continue execution...
      activitiesDebug(`Executing scheduled function ${functionName} at ${now}`)
      // lock the database with the function name
      // lock should be: functionName, date with seconds only? precision, job state -> locked/executing, failed, succeeded, free?
      await callback(now)
      // update lock as succeeded
      activitiesDebug(`Finished scheduled function ${functionName} execution`)
    } catch (error) {
      // update lock as failed
      errorDebug(
        `The triggered task execution ${functionName} failed at ${now}, with error ${
          ensureError(error, 'unknown reason').message
        }`
      )
    }
  })
}
