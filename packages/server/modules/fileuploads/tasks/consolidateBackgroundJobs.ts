import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { db } from '@/db/knex'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getBackgroundJobsFromThisOrigin } from '@/modules/backgroundjobs/repositories'
import { consolidateBackgroundJobsWithFileImports } from '@/modules/fileuploads/services/tasks'

export const scheduleFileImportExpiry = async ({
  scheduleExecution,
  cronExpression
}: {
  scheduleExecution: ScheduleExecution
  cronExpression: string
}) => {
  const perDbTask: ReturnType<typeof consolidateBackgroundJobsWithFileImports>[] = []
  const regionClients = await getRegisteredDbClients()
  for (const projectDb of [db, ...regionClients]) {
    perDbTask.push(
      consolidateBackgroundJobsWithFileImports({
        getBackgroundJobs: getBackgroundJobsFromThisOrigin({
          db: projectDb
        }),
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
