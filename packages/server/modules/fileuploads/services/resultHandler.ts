import type { Logger } from '@/observability/logging'
import type {
  ProcessFileImportResult,
  UpdateFileUpload
} from '@/modules/fileuploads/domain/operations'
import {
  jobResultStatusToFileUploadStatus,
  jobResultToConvertedMessage
} from '@/modules/fileuploads/helpers/convert'
import { ensureError } from '@speckle/shared'
import type { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import {
  BackgroundJobStatus,
  type UpdateBackgroundJob
} from '@/modules/backgroundjobs/domain/types'
import {
  type FileImportJobPayloadV1,
  JobResultStatus
} from '@speckle/shared/workers/fileimport'

type OnFileImportResultDeps = {
  updateFileUpload: UpdateFileUpload
  updateBackgroundJob: UpdateBackgroundJob<FileImportJobPayloadV1>
  eventEmit: EventBusEmit
  logger: Logger
  FF_NEXT_GEN_FILE_IMPORTER_ENABLED: boolean
}

export const onFileImportResultFactory =
  (deps: OnFileImportResultDeps): ProcessFileImportResult =>
  async (params) => {
    const { logger } = deps
    const { blobId, jobResult } = params

    const boundLogger = logger.child({
      blobId
    })

    let convertedCommitId = null
    let newStatusForBackgroundJob: BackgroundJobStatus = BackgroundJobStatus.Processing

    switch (jobResult.status) {
      case JobResultStatus.Error:
        boundLogger.warn(
          {
            duration: jobResult.result.durationSeconds,
            err: { message: jobResult.reason }
          },
          'Processing error result for file upload'
        )
        newStatusForBackgroundJob = BackgroundJobStatus.Failed
        break
      case JobResultStatus.Success:
        convertedCommitId = jobResult.result.versionId
        newStatusForBackgroundJob = BackgroundJobStatus.Succeeded
        boundLogger.info(
          {
            duration: jobResult.result.durationSeconds,
            versionId: jobResult.result.versionId
          },
          'Processing success result for file upload'
        )
        break
    }

    const status = jobResultStatusToFileUploadStatus(jobResult.status)
    const convertedMessage = jobResultToConvertedMessage(jobResult)

    if (deps.FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
      try {
        const updatedBackgroundJobs = await deps.updateBackgroundJob({
          payloadFilter: { blobId },
          status: newStatusForBackgroundJob
        })
        if (updatedBackgroundJobs.length === 0) {
          boundLogger.warn(
            'No background job found to update for this file upload. Background job may already be in a succeeded state. Blob ID: {blobId}'
          )
        } else if (updatedBackgroundJobs.length > 1) {
          boundLogger.warn(
            { count: updatedBackgroundJobs.length },
            'Multiple background jobs found to update for this file upload. Blob ID: {blobId}'
          )
        }
      } catch (e) {
        const err = ensureError(e)
        logger.error(
          { err, blobId },
          'Error updating background jobs status in database. Blob ID: {blobId}'
        )
        throw err
      }
    }

    const updatedFiles: FileUploadRecord[] = []
    try {
      updatedFiles.push(
        ...(await deps.updateFileUpload({
          id: blobId,
          upload: {
            convertedStatus: status,
            convertedLastUpdate: new Date(),
            convertedMessage,
            convertedCommitId,
            performanceData: {
              durationSeconds: jobResult.result.durationSeconds,
              downloadDurationSeconds: jobResult.result.downloadDurationSeconds,
              parseDurationSeconds: jobResult.result.parseDurationSeconds
            }
          }
        }))
      )
    } catch (e) {
      const err = ensureError(e)
      logger.error(
        { err, info: { fileId: blobId } },
        'Error updating imported file status in database. File ID: {fileId}'
      )
      throw err
    }

    for (const updatedFile of updatedFiles) {
      await deps.eventEmit({
        eventName: FileuploadEvents.Updated,
        payload: {
          upload: {
            ...updatedFile,
            projectId: updatedFile.streamId
          },
          isNewModel: false // next gen file uploads don't support this
        }
      })
    }

    await deps.eventEmit({
      eventName: FileuploadEvents.Finished,
      payload: {
        jobId: blobId,
        jobResult
      }
    })

    logger.info('File upload status updated')
  }
