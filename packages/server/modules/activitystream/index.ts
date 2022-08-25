import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import debug from 'debug'
import cron from 'node-cron'
import { noop } from 'lodash'
import { sendSummaryEmails } from '@/modules/activitystream/services/summary'
import * as SendingService from '@/modules/emails/services/sending'

const modulesDebug = debug('speckle').extend('modules')
const activitiesDebug = modulesDebug.extend('activities')

const activityModule: SpeckleModule = {
  init: async () => {
    modulesDebug('🤺 Init activity module')

    const cronExpression = '*/1000 * * * * *'
    cron.validate(cronExpression)
    cron.schedule(cronExpression, async () => {
      activitiesDebug('Sending weekly email digests.')
      const numberOfDays = 365
      const end = new Date()
      const start = new Date(end.getTime())
      start.setDate(start.getDate() - numberOfDays)
      const sendResult = await sendSummaryEmails(start, end, SendingService.sendEmail)
      sendResult
        ? activitiesDebug('Successfully sent all summaries')
        : activitiesDebug('Sending some email summaries failed')
    })
  },
  finalize: noop
}

export = {
  ...activityModule
}
