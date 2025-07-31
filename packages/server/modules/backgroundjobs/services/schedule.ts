import type cron from 'node-cron'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import {
  getFeatureFlags,
  getFileImporterQueuePostgresUrl
} from '@/modules/shared/helpers/envHelper'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { db } from '@/db/knex'
import { configureClient } from '@/knexfile'
import type { Logger } from '@/observability/logging'
import { BackgroundJobStatus } from '@/modules/backgroundjobs/domain'
import type { Knex } from 'knex'
import {
  getStaleBackgroundJobsFactory,
  updateBackgroundJobStatusFactory
} from '@/modules/backgroundjobs/repositories'

const scheduledTasks: cron.ScheduledTask[] = []

const { FF_BACKGROUND_JOBS_ENABLED } = getFeatureFlags()

const requeueStaleBackgroundJobsFactory =
  ({ db, logger }: { logger: Logger; db: Knex }) =>
  async () => {
    // so we do not infer in other updates etc
    const tsx = await db.transaction()
    const getStaleBackgroundJobs = getStaleBackgroundJobsFactory({ db: tsx })
    const updateBackgroundJobStatus = updateBackgroundJobStatusFactory({ db: tsx })

    const staleTransactions = await getStaleBackgroundJobs()

    if (!staleTransactions.length) {
      await tsx.commit()
      return
    }

    logger.warn(
      {
        ids: staleTransactions.map((t) => t.id)
      },
      'Requeueing stale transactions...'
    )

    await Promise.all(
      staleTransactions.map(async (transaction) => {
        await updateBackgroundJobStatus({
          jobId: transaction.id,
          status: BackgroundJobStatus.Queued
        })
      })
    )

    await tsx.commit()
  }

export const startSchedule = () => {
  if (!FF_BACKGROUND_JOBS_ENABLED) return

  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  const connectionUri = getFileImporterQueuePostgresUrl()
  const queueDb = connectionUri
    ? configureClient({ postgres: { connectionUri } }).public
    : db

  const every3Mins = '*/3 * * * *'
  scheduledTasks.push(
    scheduleExecution(
      every3Mins,
      'RollbackStalePreparedTransactions',
      async (_scheduledTime, { logger }) => {
        await requeueStaleBackgroundJobsFactory({ logger, db: queueDb })()
      }
    )
  )
}

export const shutdownSchedule = () => {
  scheduledTasks?.forEach((task) => task.stop())
}
