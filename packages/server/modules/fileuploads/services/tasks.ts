import type { Logger } from '@/observability/logging'
import type {
  FailPendingUploadedFiles,
  GarbageCollectPendingUploadedFiles,
  NotifyChangeInFileStatus
} from '@/modules/fileuploads/domain/operations'
import type { FailQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget } from '@/modules/backgroundjobs/domain'
import type { FileImportJobPayloadV2 } from '@speckle/shared/workers/fileimport'
import { BackgroundJobType } from '@/modules/fileuploads/domain/consts'

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
  failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget: FailQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget<FileImportJobPayloadV2>
  failPendingUploadedFiles: FailPendingUploadedFiles
  notifyUploadStatus: NotifyChangeInFileStatus
}): ((params: { logger: Logger; originServerUrl: string }) => Promise<void>) => {
  const {
    failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget,
    failPendingUploadedFiles,
    notifyUploadStatus
  } = deps
  return async (params) => {
    const { logger, originServerUrl } = params

    const failedBackgroundJobs =
      await failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget(
        {
          originServerUrl,
          jobType: BackgroundJobType.FileImport
        }
      )

    logger.info(
      { numberOfFailedBackgroundJobs: failedBackgroundJobs.length },
      'Found {numberOfFailedBackgroundJobs} background jobs which have exceeded maximum number of attempts or exceeded their compute budget'
    )

    if (failedBackgroundJobs.length === 0) {
      return
    }

    const validFailedBackgroundJobs = failedBackgroundJobs.filter(
      (job) => !!job.payload.blobId
    )
    if (validFailedBackgroundJobs.length !== failedBackgroundJobs.length) {
      logger.warn('Some failed background jobs do not have a valid blob ID')
    }

    const fileIds = validFailedBackgroundJobs.map((job) => job.payload.blobId)

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
