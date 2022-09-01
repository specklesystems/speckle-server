import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import cron from 'node-cron'
import { sendSummaryEmails } from '@/modules/activitystream/services/summary'
import * as SendingService from '@/modules/emails/services/sending'
import { initializeEventListener } from '@/modules/activitystream/services/eventListener'
import { modulesDebug } from '@/modules/shared/utils/logger'

const activitiesDebug = modulesDebug.extend('activities')

const activityModule: SpeckleModule = {
  init: async (_, isInitial) => {
    modulesDebug('🤺 Init activity module')
    if (isInitial) {
      initializeEventListener()
    }

    const cronExpression = '*/1000 * * * * *'
    cron.validate(cronExpression)
    cron.schedule(cronExpression, async () => {
      activitiesDebug('Sending weekly email digests.')
      const numberOfDays = 365
      const end = new Date()
      const start = new Date(end.getTime())
      start.setDate(start.getDate() - numberOfDays)
      // const sendResult = await sendSummaryEmails(start, end, SendingService.sendEmail)
      // sendResult
      //   ? activitiesDebug('Successfully sent all summaries')
      //   : activitiesDebug('Sending some email summaries failed')
    })
  }
}

export = {
  ...activityModule
}
