import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { publishNotification } from '@/modules/notifications/services/publication'
import { moduleLogger } from '@/observability/logging'
import { weeklyEmailDigestEnabled } from '@/modules/shared/helpers/envHelper'
import { EventBus, getEventBus } from '@/modules/shared/services/eventBus'
import { sendActivityNotificationsFactory } from '@/modules/activitystream/services/summary'
import {
  getActiveUserStreamsFactory,
  saveActivityFactory,
  saveStreamActivityFactory
} from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { Knex } from 'knex'
import { reportUserActivityFactory } from '@/modules/activitystream/events/userListeners'
import { reportAccessRequestActivityFactory } from '@/modules/activitystream/events/accessRequestListeners'
import { reportBranchActivityFactory } from '@/modules/activitystream/events/branchListeners'
import { reportCommitActivityFactory } from '@/modules/activitystream/events/commitListeners'
import { reportCommentActivityFactory } from '@/modules/activitystream/events/commentListeners'
import { reportStreamInviteActivityFactory } from '@/modules/activitystream/events/streamInviteListeners'
import { getProjectInviteProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { reportStreamActivityFactory } from '@/modules/activitystream/events/streamListeners'
import { TIME_MS } from '@speckle/shared'
import { reportGatekeeperActivityFactory } from '@/modules/activitystream/events/gatekeeperListeners'

let scheduledTask: ReturnType<ScheduleExecution> | null = null
let quitEventListeners: Optional<() => void> = undefined

/**
 * Initialize event listener for tracking various Speckle events and responding
 * to them by creating activitystream entries
 */
const initializeEventListeners = ({
  eventBus,
  db
}: {
  eventBus: EventBus
  db: Knex
}) => {
  const saveStreamActivity = saveStreamActivityFactory({ db })
  const reportUserActivity = reportUserActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveStreamActivity
  })
  const reportAccessRequestActivity = reportAccessRequestActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveStreamActivity
  })
  const reportBranchActivity = reportBranchActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveStreamActivity
  })
  const reportCommitActivity = reportCommitActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveStreamActivity
  })
  const reportCommentActivity = reportCommentActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveStreamActivity
  })
  const reportStreamInviteActivity = reportStreamInviteActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveStreamActivity,
    getProjectInviteProject: getProjectInviteProjectFactory({
      getStream: getStreamFactory({ db })
    })
  })
  const reportStreamActivity = reportStreamActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveStreamActivity
  })
  const reportGatekeeperActivity = reportGatekeeperActivityFactory({
    eventListen: eventBus.listen,
    saveActivity: saveActivityFactory({ db })
  })

  const quitCbs = [
    reportUserActivity(),
    reportAccessRequestActivity(),
    reportBranchActivity(),
    reportCommitActivity(),
    reportCommentActivity(),
    reportStreamInviteActivity(),
    reportStreamActivity(),
    reportGatekeeperActivity()
  ]

  return () => quitCbs.forEach((quit) => quit())
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
    async (now: Date, { logger }) => {
      logger.info('Sending weekly activity digests notifications.')
      const end = now
      const start = new Date(end.getTime())
      start.setDate(start.getDate() - numberOfDays)
      await sendActivityNotificationsFactory({
        publishNotification,
        getActiveUserStreams: getActiveUserStreamsFactory({ db })
      })(start, end)
    },
    10 * TIME_MS.minute
  )
}

const activityModule: SpeckleModule = {
  init: async ({ isInitial }) => {
    moduleLogger.info('🤺 Init activity module')
    if (isInitial) {
      quitEventListeners = initializeEventListeners({
        db,
        eventBus: getEventBus()
      })

      if (weeklyEmailDigestEnabled())
        scheduledTask = scheduleWeeklyActivityNotifications()
    }
  },
  shutdown: () => {
    scheduledTask?.stop()
    quitEventListeners?.()
  }
}

export = {
  ...activityModule
}
