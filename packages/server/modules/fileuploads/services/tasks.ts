import { Logger } from '@/observability/logging'
import {
  GarbageCollectPendingUploadedFiles,
  NotifyChangeInFileStatus
} from '@/modules/fileuploads/domain/operations'

export const manageFileImportExpiryFactory = (deps: {
  garbageCollectExpiredPendingUploads: GarbageCollectPendingUploadedFiles
  notifyUploadStatus: NotifyChangeInFileStatus
}) => {
  const { garbageCollectExpiredPendingUploads, notifyUploadStatus } = deps
  return async (params: { logger: Logger; timeoutThresholdSeconds: number }) => {
    const { logger, timeoutThresholdSeconds } = params
    const updatedUploads = await garbageCollectExpiredPendingUploads({
      timeoutThresholdSeconds
    })
    logger.info(`Expired ${updatedUploads.length} pending uploads`)
    for (const upload of updatedUploads) {
      await notifyUploadStatus({
        file: upload
      })
    }
  }
}
