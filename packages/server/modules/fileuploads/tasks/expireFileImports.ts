import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { expireOldPendingUploadsFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { manageFileImportExpiryFactory } from '@/modules/fileuploads/services/tasks'
import { TIME_MS } from '@speckle/shared'
import { maximumAllowedQueuingProcessingAndRetryTimeMs } from '@/modules/fileuploads/domain/consts'
import { getEventBus } from '@/modules/shared/services/eventBus'

export const scheduleFileImportExpiry = async ({
  scheduleExecution,
  cronExpression
}: {
  scheduleExecution: ScheduleExecution
  cronExpression: string
}) => {
  const fileImportExpiryHandlers: ReturnType<typeof manageFileImportExpiryFactory>[] =
    []
  const regionClients = await getRegisteredDbClients()
  for (const projectDb of [db, ...regionClients]) {
    fileImportExpiryHandlers.push(
      manageFileImportExpiryFactory({
        garbageCollectExpiredPendingUploads: expireOldPendingUploadsFactory({
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
    'FileImportExpiry',
    async (_scheduledTime, { logger }) => {
      await Promise.all(
        fileImportExpiryHandlers.map((handler) =>
          handler({
            logger,
            timeoutThresholdSeconds:
              maximumAllowedQueuingProcessingAndRetryTimeMs() / TIME_MS.second
          })
        )
      )
    }
  )
}
