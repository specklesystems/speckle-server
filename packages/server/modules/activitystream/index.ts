import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { sendActivityNotifications } from '@/modules/activitystream/services/summary'
import { initializeEventListener } from '@/modules/activitystream/services/eventListener'
import { publishNotification } from '@/modules/notifications/services/publication'
import { scheduleExecution } from '@/modules/core/services/taskScheduler'
import { activitiesLogger, moduleLogger } from '@/logging/logging'
import { weeklyEmailDigestEnabled } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { handleServerInvitesActivitiesFactory } from '@/modules/activitystream/services/serverInvitesActivity'
import { getStream } from '@/modules/core/repositories/streams'

let scheduledTask: ReturnType<typeof scheduleExecution> | null = null
let quitEventListeners: Optional<ReturnType<typeof initializeEventListeners>> =
  undefined

const initializeEventListeners = () => {
  const handleServerInvitesActivities = handleServerInvitesActivitiesFactory({
    eventBus: getEventBus(),
    logger: activitiesLogger,
    getStream
  })

  const quitters = [handleServerInvitesActivities()]

  return () => quitters.forEach((quitter) => quitter())
}

const scheduleWeeklyActivityNotifications = () => {
  // just to test stuff
  // every 1000 seconds
  // const cronExpression = '*/1000 * * * * *'
  // at 00 minutest, 10 (am) hours, every month, every year,
  // every 1st day of the week (monday)
  // cheat sheet https://crontab.guru
  const cronExpression = '00 10 * * 1'
  // configure the number of days, the activities are scraped for
  const numberOfDays = 7
  return scheduleExecution(
    cronExpression,
    'weeklyActivityNotification',
    //task should be locked for 10 minutes
    async (now: Date) => {
      activitiesLogger.info('Sending weekly activity digests notifications.')
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
    moduleLogger.info('🤺 Init activity module')
    if (isInitial) {
      initializeEventListener()
      if (weeklyEmailDigestEnabled())
        scheduledTask = scheduleWeeklyActivityNotifications()
    }
    quitEventListeners = initializeEventListeners()
  },
  shutdown: () => {
    scheduledTask?.stop()
    quitEventListeners?.()
  }
}

export = {
  ...activityModule
}
