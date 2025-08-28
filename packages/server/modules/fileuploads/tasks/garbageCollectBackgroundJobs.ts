import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { db } from '@/db/knex'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { garbageCollectAttemptedFileImportBackgroundJobs } from '@/modules/fileuploads/services/tasks'
import { failPendingUploadedFilesFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { failQueuedBackgroundJobsWhichExceedMaximumAttemptsFactory } from '@/modules/backgroundjobs/repositories'
import type { Knex } from 'knex'

export const scheduleBackgroundJobGarbageCollection = async ({
  queueDb,
  scheduleExecution,
  cronExpression
}: {
  queueDb: Knex
  scheduleExecution: ScheduleExecution
  cronExpression: string
}) => {
  const perDbTask: ReturnType<
    typeof garbageCollectAttemptedFileImportBackgroundJobs
  >[] = []
  const regionClients = await getRegisteredDbClients()
  for (const projectDb of [db, ...regionClients]) {
    perDbTask.push(
      garbageCollectAttemptedFileImportBackgroundJobs({
        failQueuedBackgroundJobsWhichExceedMaximumAttempts:
          failQueuedBackgroundJobsWhichExceedMaximumAttemptsFactory({
            db: queueDb
          }),
        failPendingUploadedFiles: failPendingUploadedFilesFactory({ db: projectDb }),
        notifyUploadStatus: notifyChangeInFileStatus({
          eventEmit: getEventBus().emit
        })
      })
    )
  }

  return scheduleExecution(
    cronExpression,
    'FileImportAndBackgroundJobsConsolidation',
    async (_scheduledTime, { logger }) => {
      await Promise.all(
        perDbTask.map((task) =>
          task({
            logger
          })
        )
      )
    }
  )
}
