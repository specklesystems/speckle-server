import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { publishNotification } from '@/modules/notifications/services/publication'
import { activitiesLogger, logger, moduleLogger } from '@/logging/logging'
import { weeklyEmailDigestEnabled } from '@/modules/shared/helpers/envHelper'
import { EventBus, getEventBus } from '@/modules/shared/services/eventBus'
import { sendActivityNotificationsFactory } from '@/modules/activitystream/services/summary'
import {
  getActiveUserStreamsFactory,
  saveActivityFactory
} from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'
import {
  addStreamCreatedActivityFactory,
  addStreamInviteSentOutActivityFactory
} from '@/modules/activitystream/services/streamActivity'
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
import { Knex } from 'knex'
import {
  onServerAccessRequestCreatedFactory,
  onServerAccessRequestFinalizedFactory,
  onServerInviteCreatedFactory
} from '@/modules/activitystream/services/eventListener'
import { isProjectResourceTarget } from '@/modules/serverinvites/helpers/core'
import { publish } from '@/modules/shared/utils/subscriptions'
import { isStreamAccessRequest } from '@/modules/accessrequests/repositories'
import { ServerInvitesEvents } from '@/modules/serverinvites/domain/events'
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'
import { reportUserActivityFactory } from '@/modules/activitystream/events/userListeners'

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
  const saveActivity = saveActivityFactory({ db })
  const reportUserActivity = reportUserActivityFactory({
    eventListen: eventBus.listen,
    saveActivity
  })
  const quitCbs = [
    reportUserActivity(),
    eventBus.listen(AccessRequestEvents.Created, async (payload) => {
      if (!isStreamAccessRequest(payload.payload.request)) return
      return await onServerAccessRequestCreatedFactory({
        addStreamAccessRequestedActivity: addStreamAccessRequestedActivityFactory({
          saveActivity: saveActivityFactory({ db })
        })
      })(payload)
    }),
    eventBus.listen(AccessRequestEvents.Finalized, async (payload) => {
      if (!isStreamAccessRequest(payload.payload.request)) return
      await onServerAccessRequestFinalizedFactory({
        addStreamAccessRequestDeclinedActivity:
          addStreamAccessRequestDeclinedActivityFactory({
            saveActivity: saveActivityFactory({ db })
          })
      })(payload)
    }),
    eventBus.listen(ServerInvitesEvents.Created, async ({ payload }) => {
      if (!isProjectResourceTarget(payload.invite.resource)) return
      await onServerInviteCreatedFactory({
        addStreamInviteSentOutActivity: addStreamInviteSentOutActivityFactory({
          publish,
          saveActivity: saveActivityFactory({ db })
        }),
        logger,
        getStream: getStreamFactory({ db })
      })(payload)
    }),
    eventBus.listen(
      ProjectEvents.Created,
      async ({ payload: { ownerId, project } }) => {
        await addStreamCreatedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })({
          streamId: project.id,
          creatorId: ownerId,
          stream: project,
          input: project
        })
      }
    )
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
