import type { Logger } from '@/observability/logging'
import type {
  FailPendingUploadedFiles,
  GarbageCollectPendingUploadedFiles,
  NotifyChangeInFileStatus
} from '@/modules/fileuploads/domain/operations'
import type {
  FailQueueAndProcessingBackgroundJobWithNoRemainingComputeBudget,
  FailQueuedBackgroundJobsWhichExceedMaximumAttempts
} from '@/modules/backgroundjobs/domain'
import type { FileImportJobPayloadV2 } from '@speckle/shared/workers/fileimport'
import { BackgroundJobType } from '@/modules/fileuploads/domain/consts'
import { concat } from 'lodash-es'

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
  failQueueAndProcessingBackgroundJobWithNoRemainingComputeBudget: FailQueueAndProcessingBackgroundJobWithNoRemainingComputeBudget<FileImportJobPayloadV2>
  failPendingUploadedFiles: FailPendingUploadedFiles
  notifyUploadStatus: NotifyChangeInFileStatus
}): ((params: { logger: Logger; originServerUrl: string }) => Promise<void>) => {
  const {
    failQueuedBackgroundJobsWhichExceedMaximumAttempts,
    failQueueAndProcessingBackgroundJobWithNoRemainingComputeBudget,
    failPendingUploadedFiles,
    notifyUploadStatus
  } = deps
  return async (params) => {
    const { logger, originServerUrl } = params

    const exceededMaximumAttemptsBackgroundJobs =
      await failQueuedBackgroundJobsWhichExceedMaximumAttempts({
        originServerUrl,
        jobType: BackgroundJobType.FileImport
      })

    const outOfComputeBudgetJobs =
      await failQueueAndProcessingBackgroundJobWithNoRemainingComputeBudget({
        originServerUrl,
        jobType: BackgroundJobType.FileImport
      })

    const failedBackgroundJobs = concat(
      exceededMaximumAttemptsBackgroundJobs,
      outOfComputeBudgetJobs
    )

    logger.info(
      `Found ${failedBackgroundJobs.length} background jobs which have exceeded maximum number of attempts or exceeded their compute budget`
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
