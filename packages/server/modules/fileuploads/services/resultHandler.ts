import type { Logger } from '@/observability/logging'
import type {
  GetFileInfoV2,
  ProcessFileImportResult,
  UpdateFileUpload
} from '@/modules/fileuploads/domain/operations'
import {
  jobResultStatusToFileUploadStatus,
  jobResultToConvertedMessage
} from '@/modules/fileuploads/helpers/convert'
import { ensureError } from '@speckle/shared'
import type { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import { FileImportJobNotFoundError } from '@/modules/fileuploads/helpers/errors'
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
  getFileInfo: GetFileInfoV2
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
    const { jobId, jobResult } = params

    const fileInfo = await deps.getFileInfo({ fileId: jobId })
    if (!fileInfo) {
      throw new FileImportJobNotFoundError(`File upload with ID ${jobId} not found`)
    }

    const boundLogger = logger.child({
      jobId,
      fileId: fileInfo.id,
      fileSize: fileInfo.fileSize,
      fileName: fileInfo.fileName,
      fileType: fileInfo.fileType,
      projectId: fileInfo.projectId,
      streamId: fileInfo.projectId, // legacy for backwards compatibility
      modelId: fileInfo.modelId,
      branchId: fileInfo.modelId, // legacy for backwards compatibility
      userId: fileInfo.userId
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
        await deps.updateBackgroundJob({
          payloadFilter: { jobId },
          status: newStatusForBackgroundJob
        })
      } catch (e) {
        const err = ensureError(e)
        logger.error(
          { err, jobId },
          'Error updating background job status in database. Job ID: {jobId}'
        )
        throw err
      }
    }

    let updatedFile: FileUploadRecord
    try {
      updatedFile = await deps.updateFileUpload({
        id: jobId,
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
      })
    } catch (e) {
      const err = ensureError(e)
      logger.error(
        { err },
        'Error updating imported file status in database. File ID: %s',
        jobId
      )
      throw err
    }

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

    await deps.eventEmit({
      eventName: FileuploadEvents.Finished,
      payload: {
        jobId,
        jobResult
      }
    })

    logger.info('File upload status updated')
  }
