import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import cron from 'node-cron'
import { sendActivityNotifications } from '@/modules/activitystream/services/summary'
import { initializeEventListener } from '@/modules/activitystream/services/eventListener'
import { modulesDebug } from '@/modules/shared/utils/logger'
import { publishNotification } from '@/modules/notifications/services/publication'
import { scheduleExecution } from '@/modules/core/services/taskScheduler'

const activitiesDebug = modulesDebug.extend('activities')

let scheduledTask: cron.ScheduledTask | null = null

const scheduleWeeklyActivityNotifications = () => {
  // just to test stuff
  // every 1000 seconds
  // const cronExpression = '*/1000 * * * * *'
  // at 00 minutest, 10 (am) hours, every month, every year,
  // every 1st day of the week (monday)
  // cheat sheet https://crontab.guru
  const cronExpression = '00 13 * * 5'
  // configure the number of days, the activities are scraped for
  const numberOfDays = 7
  return scheduleExecution(
    cronExpression,
    'weeklyActivityNotification',
    //task should be locked for 10 minutes
    async (now: Date) => {
      activitiesDebug('Sending weekly activity digests notifications.')
      const end = now
      const start = new Date(end.getTime())
      start.setDate(start.getDate() - numberOfDays)
      await sendActivityNotifications(start, end, publishNotification)
    },
    10 * 60 * 1000
  )
}

const activityModule: SpeckleModule = {
  init: async (_, isInitial) => {
    modulesDebug('🤺 Init activity module')
    if (isInitial) {
      initializeEventListener()
      scheduledTask = scheduleWeeklyActivityNotifications()
    }
  },
  shutdown: () => {
    if (scheduledTask) scheduledTask.stop()
  }
}

export = {
  ...activityModule
}
