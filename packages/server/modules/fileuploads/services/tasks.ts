import type { Logger } from '@/observability/logging'
import type {
  GarbageCollectPendingUploadedFiles,
  NotifyChangeInFileStatus
} from '@/modules/fileuploads/domain/operations'
import { BackgroundJobStatus, BackgroundJobType, GetBackgroundJob, GetFilteredBackgroundJobs } from '@/modules/backgroundjobs/domain'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'

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

export const consolidateBackgroundJobsWithFileImports = (deps: {
  getBackgroundJobs: GetFilteredBackgroundJobs
  notifyUploadStatus: NotifyChangeInFileStatus
}) => {
  const { getBackgroundJobs, notifyUploadStatus } = deps
  return async (params: { logger: Logger, updatedAfter: Date }) => {
    const { logger, updatedAfter } = params
    const backgroundJobs = await getBackgroundJobs({
      jobType: BackgroundJobType.FileImport,
      originServerUrl: getServerOrigin(),
      status: BackgroundJobStatus.Failed,
      updatedAfter
    })
    logger.info(`Found ${backgroundJobs.length} background jobs`)
    //TODO given all the background jobs, we need to find the matching file upload. If the background job is success or failure, we need to ensure the file upload is in a matching state.
    for (const job of backgroundJobs) {
      await notifyUploadStatus({
        file: job.file
      })
    }
  }
}
