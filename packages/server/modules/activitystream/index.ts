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

    // just to test stuff
    // every 1000 seconds
    // const cronExpression = '*/1000 * * * * *'
    // at 00 minutest, 10 (am) hours, every month, every year,
    // every 1st day of the week (monday)
    // cheat sheet https://crontab.guru
    const cronExpression = '00 10 * * 1'
    // configure the number of days, the activities are scraped for
    const numberOfDays = 7
    cron.validate(cronExpression)
    cron.schedule(cronExpression, async () => {
      activitiesDebug('Sending weekly email digests.')
      const end = new Date()
      const start = new Date(end.getTime())
      start.setDate(start.getDate() - numberOfDays)
      const sendResult = await sendSummaryEmails(start, end, SendingService.sendEmail)
      sendResult
        ? activitiesDebug('Successfully sent all summaries')
        : activitiesDebug('Sending some email summaries failed')
    })
  }
}

export = {
  ...activityModule
}
