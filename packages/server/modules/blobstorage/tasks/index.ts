import { db } from '@/db/knex'
import type { ScheduleExecution } from '@/modules/core/domain/scheduledTasks/operations'
import { getRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import { getFileUploadUrlExpiryMinutes } from '@/modules/shared/helpers/envHelper'
import { TIME } from '@speckle/shared'
import type { ExpirePendingUploads } from '@/modules/blobstorage/domain/operations'
import { expirePendingUploadsFactory } from '@/modules/blobstorage/repositories'

export const scheduleBlobPendingUploadExpiry = async ({
  scheduleExecution
}: {
  scheduleExecution: ScheduleExecution
}) => {
  const blobPendingUploadExpiryHandlers: ExpirePendingUploads[] = []
  const regionClients = await getRegisteredDbClients()
  for (const projectDb of [db, ...regionClients]) {
    blobPendingUploadExpiryHandlers.push(expirePendingUploadsFactory({ db: projectDb }))
  }

  const cronExpression = '*/6 * * * *' // every 6 minutes
  return scheduleExecution(
    cronExpression,
    'BlobPendingUploadExpiry',
    async (_, options) => {
      const { logger } = options
      logger.debug('Running BlobPendingUploadExpiry task')
      const items = await Promise.all(
        blobPendingUploadExpiryHandlers.map((handler) =>
          handler({
            timeoutThresholdSeconds:
              (getFileUploadUrlExpiryMinutes() + 1) * TIME.minute, // additional buffer of 1 minute
            errMessage:
              '[EXPIRED_PENDING_UPLOAD] Upload did not complete within the expected time frame.'
          })
        )
      )
      logger.info(
        `BlobPendingUploadExpiry task completed. Processed ${items.reduce(
          (acc, items) => acc + items.length,
          0
        )} items.`
      )
    }
  )
}
