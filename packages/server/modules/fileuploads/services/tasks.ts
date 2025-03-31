import { Logger } from '@/observability/logging'
import {
  GarbageCollectPendingUploadedFiles,
  NotifyChangeInFileStatus
} from '@/modules/fileuploads/domain/operations'

export const manageFileImportExpiryFactory = (deps: {
  garbageCollectExpiredPendingUploads: GarbageCollectPendingUploadedFiles
  notifyUploadStatus: NotifyChangeInFileStatus
}) => {
  const {} = deps
  return async (params: { logger: Logger; timeoutThresholdSeconds: number }) => {
    const { logger, timeoutThresholdSeconds } = params
    const updatedUploads = await deps.garbageCollectExpiredPendingUploads({
      timeoutThresholdSeconds
    })
    logger.info(`Expired ${updatedUploads.length} pending uploads`)
    for (const upload of updatedUploads) {
      await deps.notifyUploadStatus({
        file: upload
      })
    }
  }
}
