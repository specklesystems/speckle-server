import { Logger } from '@/observability/logging'
import {
  GetAllPendingUploads,
  UpdateFileStatusAndNotify
} from '@/modules/fileuploads/domain/operations'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'

export const manageFileImportExpiryFactory = (deps: {
  getPendingUploads: GetAllPendingUploads
  updateUploadStatus: UpdateFileStatusAndNotify
}) => {
  const {} = deps
  return async (params: { logger: Logger; timeoutThresholdSeconds: number }) => {
    const { logger } = params
    const now = new Date().getTime()
    logger.info('Managing file import expiry')
    // Logic to manage file import expiry goes here
    // check for expired file imports
    // if over some timeout threshold, move them into an error state
    // and notify the user
    const pendingUploads = await deps.getPendingUploads({
      limit: 100
    })
    logger.info(`Found ${pendingUploads.length} pending uploads`)
    for (const upload of pendingUploads) {
      const uploadDate = new Date(upload.uploadDate).getTime()
      const diff = now - uploadDate
      if (diff > 1000 * params.timeoutThresholdSeconds) {
        logger.info(`Marking upload ${upload.id} as error`)
        await deps.updateUploadStatus({
          streamId: upload.streamId,
          branchName: upload.branchName,
          fileId: upload.id,
          newStatus: FileUploadConvertedStatus.Error
        })
      }
    }
  }
}
