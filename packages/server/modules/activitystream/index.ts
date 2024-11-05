import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { initializeEventListenerFactory } from '@/modules/activitystream/services/eventListener'
import { publishNotification } from '@/modules/notifications/services/publication'
import { activitiesLogger, moduleLogger } from '@/logging/logging'
import { weeklyEmailDigestEnabled } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { handleServerInvitesActivitiesFactory } from '@/modules/activitystream/services/serverInvitesActivity'
import { sendActivityNotificationsFactory } from '@/modules/activitystream/services/summary'
import {
  getActiveUserStreamsFactory,
  saveActivityFactory
} from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'
import { addStreamInviteSentOutActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import {
  addStreamAccessRequestDeclinedActivityFactory,
  addStreamAccessRequestedActivityFactory
} from '@/modules/activitystream/services/accessRequestActivity'
import { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'

let scheduledTask: ReturnType<ScheduleExecution> | null = null
let quitEventListeners: Optional<ReturnType<typeof initializeEventListeners>> =
  undefined

const initializeEventListeners = () => {
  const handleServerInvitesActivities = handleServerInvitesActivitiesFactory({
    eventBus: getEventBus(),
    logger: activitiesLogger,
    getStream: getStreamFactory({ db }),
    addStreamInviteSentOutActivity: addStreamInviteSentOutActivityFactory({
      saveActivity: saveActivityFactory({ db }),
      publish
    })
  })

  const quitters = [handleServerInvitesActivities()]

  return () => quitters.forEach((quitter) => quitter())
}

const scheduleWeeklyActivityNotifications = () => {
  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

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
      await sendActivityNotificationsFactory({
        publishNotification,
        getActiveUserStreams: getActiveUserStreamsFactory({ db })
      })(start, end)
    },
    10 * 60 * 1000
  )
}

const activityModule: SpeckleModule = {
  init: async (_, isInitial) => {
    moduleLogger.info('🤺 Init activity module')
    if (isInitial) {
      initializeEventListenerFactory({
        addStreamAccessRequestedActivity: addStreamAccessRequestedActivityFactory({
          saveActivity: saveActivityFactory({ db })
        }),
        addStreamAccessRequestDeclinedActivity:
          addStreamAccessRequestDeclinedActivityFactory({
            saveActivity: saveActivityFactory({ db })
          }),
        saveActivity: saveActivityFactory({ db })
      })()
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
