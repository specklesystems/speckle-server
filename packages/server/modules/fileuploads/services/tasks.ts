import type { Logger } from '@/observability/logging'
import type {
  FailPendingUploadedFiles,
  GarbageCollectPendingUploadedFiles,
  NotifyChangeInFileStatus
} from '@/modules/fileuploads/domain/operations'
import type { FailQueuedBackgroundJobsWhichExceedMaximumAttempts } from '@/modules/backgroundjobs/domain'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { FileImportJobPayloadV1 } from '@speckle/shared/workers/fileimport'
import { get } from 'lodash-es'
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

export const garbageCollectAttemptedFileImportBackgroundJobs = (deps: {
  failQueuedBackgroundJobsWhichExceedMaximumAttempts: FailQueuedBackgroundJobsWhichExceedMaximumAttempts<FileImportJobPayloadV1>
  failPendingUploadedFiles: FailPendingUploadedFiles
  notifyUploadStatus: NotifyChangeInFileStatus
}): ((params: { logger: Logger }) => Promise<void>) => {
  const {
    failQueuedBackgroundJobsWhichExceedMaximumAttempts,
    failPendingUploadedFiles,
    notifyUploadStatus
  } = deps
  return async (params) => {
    const { logger } = params

    const failedBackgroundJobs =
      await failQueuedBackgroundJobsWhichExceedMaximumAttempts({
        originServerUrl: getServerOrigin(),
        jobType: BackgroundJobType.FileImport
      })
    logger.info(
      `Found ${failedBackgroundJobs.length} background jobs which have exceeded maximum number of attempts`
    )

    const updatedUploads = await failPendingUploadedFiles({
      uploadIds: failedBackgroundJobs.map((job) => get(job.payload, 'blobId'))
    })

    for (const upload of updatedUploads) {
      await notifyUploadStatus({
        file: upload
      })
    }
  }
}
