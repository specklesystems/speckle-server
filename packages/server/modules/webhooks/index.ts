import cron from 'node-cron'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { scheduleExecution } from '@/modules/core/services/taskScheduler'
import { cleanOrphanedWebhookConfigs } from '@/modules/webhooks/services/cleanup'
import { activitiesLogger, moduleLogger } from '@/logging/logging'

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
