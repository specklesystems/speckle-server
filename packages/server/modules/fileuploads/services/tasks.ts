import type { Logger } from '@/observability/logging'
import type {
  FailPendingUploadedFiles,
  GarbageCollectPendingUploadedFiles,
  NotifyChangeInFileStatus
} from '@/modules/fileuploads/domain/operations'
import type { FailQueuedBackgroundJobsWhichExceedMaximumAttempts } from '@/modules/backgroundjobs/domain'
import type { FileImportJobPayloadV2 } from '@speckle/shared/workers/fileimport'
import { BackgroundJobType } from '@/modules/fileuploads/domain/consts'
import { LogicError } from '@/modules/shared/errors'

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

export const garbageCollectAttemptedFileImportBackgroundJobsFactory = (deps: {
  failQueuedBackgroundJobsWhichExceedMaximumAttempts: FailQueuedBackgroundJobsWhichExceedMaximumAttempts<FileImportJobPayloadV2>
  failPendingUploadedFiles: FailPendingUploadedFiles
  notifyUploadStatus: NotifyChangeInFileStatus
}): ((params: { logger: Logger; originServerUrl: string }) => Promise<void>) => {
  const {
    failQueuedBackgroundJobsWhichExceedMaximumAttempts,
    failPendingUploadedFiles,
    notifyUploadStatus
  } = deps
  return async (params) => {
    const { logger, originServerUrl } = params

    const failedBackgroundJobs =
      await failQueuedBackgroundJobsWhichExceedMaximumAttempts({
        originServerUrl,
        jobType: BackgroundJobType.FileImport
      })
    logger.info(
      `Found ${failedBackgroundJobs.length} background jobs which have exceeded maximum number of attempts`
    )

    if (failedBackgroundJobs.length === 0) {
      return
    }

    const fileIds = failedBackgroundJobs.map((job) => job.payload.blobId)
    if (fileIds.length !== failedBackgroundJobs.length || fileIds.some((id) => !id)) {
      throw new LogicError(
        'We do not have a valid file Id for all failed background jobs',
        {
          info: {
            fileIds
          }
        }
      )
    }

    const updatedUploads = await failPendingUploadedFiles({
      uploadIds: fileIds
    })

    for (const upload of updatedUploads) {
      await notifyUploadStatus({
        file: upload
      })
    }
  }
}
