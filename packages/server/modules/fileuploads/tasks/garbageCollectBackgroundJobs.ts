import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { db } from '@/db/knex'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { garbageCollectAttemptedFileImportBackgroundJobsFactory } from '@/modules/fileuploads/services/tasks'
import { failPendingUploadedFilesFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { failBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory } from '@/modules/backgroundjobs/repositories/backgroundjobs'
import type { Knex } from 'knex'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'

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
    typeof garbageCollectAttemptedFileImportBackgroundJobsFactory
  >[] = []
  const regionClients = await getRegisteredDbClients()
  for (const projectDb of [db, ...regionClients]) {
    perDbTask.push(
      garbageCollectAttemptedFileImportBackgroundJobsFactory({
        failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget:
          failBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory(
            {
              db: queueDb
            }
          ),
        failPendingUploadedFiles: failPendingUploadedFilesFactory({ db: projectDb }),
        notifyUploadStatus: notifyChangeInFileStatus({
          eventEmit: getEventBus().emit
        })
      })
    )
  }

  return scheduleExecution(
    cronExpression,
    'GarbageCollectBackgroundJobs',
    async (_scheduledTime, { logger }) => {
      await Promise.all(
        perDbTask.map((task) =>
          task({
            logger,
            originServerUrl: getServerOrigin()
          })
        )
      )
    }
  )
}
