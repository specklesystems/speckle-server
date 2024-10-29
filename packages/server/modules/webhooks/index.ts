import cron from 'node-cron'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { activitiesLogger, moduleLogger } from '@/logging/logging'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import { acquireTaskLockFactory } from '@/modules/core/repositories/scheduledTasks'
import { cleanOrphanedWebhookConfigsFactory } from '@/modules/webhooks/repositories/cleanup'
import { Knex } from 'knex'
import { db } from '@/db/knex'

const scheduleWebhookCleanupFactory = ({ db }: { db: Knex }) => {
  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db })
  })

  const cronExpression = '0 4 * * 1'
  return scheduleExecution(cronExpression, 'weeklyWebhookCleanup', async () => {
    activitiesLogger.info('Starting weekly webhooks cleanup')
    await cleanOrphanedWebhookConfigsFactory({ db })()
    activitiesLogger.info('Finished cleanup')
  })
}

let scheduledTask: cron.ScheduledTask | null = null

export const init: SpeckleModule['init'] = () => {
  moduleLogger.info('🎣 Init webhooks module')
  scheduledTask = scheduleWebhookCleanupFactory({ db })
}

export const shutdown: SpeckleModule['shutdown'] = () => {
  if (scheduledTask) scheduledTask.stop()
}
