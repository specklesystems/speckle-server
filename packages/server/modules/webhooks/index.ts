import { activitiesLogger, moduleLogger } from '@/logging/logging'
import { scheduleExecution } from '@/modules/core/services/taskScheduler'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { cleanOrphanedWebhookConfigs } from '@/modules/webhooks/services/cleanup'
import cron from 'node-cron'

const scheduleWebhookCleanup = () => {
  const cronExpression = '0 4 * * 1'
  return scheduleExecution(cronExpression, 'weeklyWebhookCleanup', async () => {
    activitiesLogger.info('Starting weekly webhooks cleanup')
    await cleanOrphanedWebhookConfigs()
    activitiesLogger.info('Finished cleanup')
  })
}

let scheduledTask: cron.ScheduledTask | null = null

export const init: SpeckleModule['init'] = () => {
  moduleLogger.info('🎣 Init webhooks module')
  scheduledTask = scheduleWebhookCleanup()
}

export const shutdown: SpeckleModule['shutdown'] = () => {
  if (scheduledTask) scheduledTask.stop()
}
