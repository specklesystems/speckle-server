import { getFileImportTimeLimitMinutes } from '@/modules/shared/helpers/envHelper'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { expireOldPendingUploadsFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { publish } from '@/modules/shared/utils/subscriptions'
import { db } from '@/db/knex'
import { TIME } from '@speckle/shared'
import { manageFileImportExpiryFactory } from '@/modules/fileuploads/services/tasks'

export const scheduleFileImportExpiry = async ({
  scheduleExecution
}: {
  scheduleExecution: ScheduleExecution
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
          getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
          publish
        })
      })
    )
  }

  const cronExpression = '*/5 * * * *' // every 5 minutes
  return scheduleExecution(
    cronExpression,
    'FileImportExpiry',
    async (_scheduledTime, { logger }) => {
      await Promise.all(
        fileImportExpiryHandlers.map((handler) =>
          handler({
            logger,
            timeoutThresholdSeconds: (getFileImportTimeLimitMinutes() + 1) * TIME.minute // additional buffer of 1 minute
          })
        )
      )
    }
  )
}
