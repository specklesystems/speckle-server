import cron from 'node-cron'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { modulesDebug } from '@/modules/shared/utils/logger'
import { scheduleExecution } from '@/modules/core/services/taskScheduler'
import { cleanOrphanedWebhookConfigs } from '@/modules/webhooks/services/cleanup'

const webhooksDebug = modulesDebug.extend('activities')

const scheduleWebhookCleanup = () => {
  const cronExpression = '0 4 * * 1'
  return scheduleExecution(cronExpression, 'weeklyWebhookCleanup', async () => {
    webhooksDebug('Starting weekly webhooks cleanup')
    await cleanOrphanedWebhookConfigs()
    webhooksDebug('Finished cleanup')
  })
}

let scheduledTask: cron.ScheduledTask | null = null

export const init: SpeckleModule['init'] = () => {
  modulesDebug('🎣 Init webhooks module')
  scheduledTask = scheduleWebhookCleanup()
}

export const shutdown: SpeckleModule['shutdown'] = () => {
  if (scheduledTask) scheduledTask.stop()
}
