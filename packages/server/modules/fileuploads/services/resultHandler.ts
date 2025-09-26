import type { Logger } from '@/observability/logging'
import type {
  GetFileInfoV2,
  ProcessFileImportProgress,
  ProcessFileImportResult,
  UpdateFileUpload
} from '@/modules/fileuploads/domain/operations'
import {
  jobResultStatusToFileUploadStatus,
  jobResultToConvertedMessage
} from '@/modules/fileuploads/helpers/convert'
import { ensureError } from '@speckle/shared'
import {
  FileUploadConvertedStatus,
  type FileUploadRecord
} from '@/modules/fileuploads/helpers/types'
import {
  FileImportInvalidJobProgressPayload,
  FileImportJobNotFoundError
} from '@/modules/fileuploads/errors'
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
    const { blobId, jobResult } = params

    const fileInfo = await deps.getFileInfo({ fileId: blobId })
    if (!fileInfo) {
      throw new FileImportJobNotFoundError(`File upload with ID ${blobId} not found`)
    }

    const boundLogger = logger.child({
      blobId,
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
          payloadFilter: { blobId },
          status: newStatusForBackgroundJob
        })
      } catch (e) {
        const err = ensureError(e)
        boundLogger.error(
          { err, blobId },
          'Error updating background jobs status in database. Blob ID: {blobId}'
        )
        throw err
      }
    }

    let updatedFile: FileUploadRecord
    try {
      updatedFile = await deps.updateFileUpload({
        id: blobId,
        upload: {
          convertedStatus: status,
          convertedLastUpdate: new Date(),
          convertedMessage,
          convertedCommitId,
          performanceData: {
            durationSeconds: jobResult.result.durationSeconds,
            downloadDurationSeconds: jobResult.result.downloadDurationSeconds,
            parseDurationSeconds: jobResult.result.parseDurationSeconds,
            parser: jobResult.result.parser,
            versionId: jobResult.result.versionId ?? undefined
          }
        }
      })
    } catch (e) {
      const err = ensureError(e)
      boundLogger.error(
        { err, info: { fileId: blobId } },
        'Error updating imported file status in database. File ID: {fileId}'
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
        jobId: blobId,
        jobResult
      }
    })

    boundLogger.info('File upload status updated')
  }

type OnFileImportProgressUpdateDeps = {
  getFileInfo: GetFileInfoV2
  updateFileUpload: UpdateFileUpload
  eventEmit: EventBusEmit
  logger: Logger
  FF_NEXT_GEN_FILE_IMPORTER_ENABLED: boolean
}

export const onFileImportProgressUpdateFactory =
  (deps: OnFileImportProgressUpdateDeps): ProcessFileImportProgress =>
  async (params) => {
    const { logger } = deps
    const { blobId, progressPercentage, attempt, result, message } = params

    const fileInfo = await deps.getFileInfo({ fileId: blobId })
    if (!fileInfo) {
      throw new FileImportJobNotFoundError(`File upload with ID ${blobId} not found`)
    }

    if (
      [FileUploadConvertedStatus.Completed, FileUploadConvertedStatus.Error].includes(
        fileInfo.convertedStatus
      )
    ) {
      // nothing to do here, the job is already in a final state
      logger.warn(
        'Received progress update for a file that is already in a final state'
      )
      return false // we return false to indicate that no update was made and the job should be cancelled
    }

    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new FileImportInvalidJobProgressPayload(
        'Progress value must be between 0 and 100. Received: {progressPercentage}',
        { info: { progressPercentage } }
      )
    }

    const boundLogger = logger.child({
      blobId,
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

    let updatedFile: FileUploadRecord
    try {
      updatedFile = await deps.updateFileUpload({
        id: blobId,
        upload: {
          convertedStatus: FileUploadConvertedStatus.Converting,
          convertedLastUpdate: new Date(),
          convertedMessage: message ?? fileInfo.convertedMessage,
          convertedProgress: progressPercentage,
          convertedAttempt: attempt,
          performanceData: {
            durationSeconds: result?.durationSeconds ?? 0,
            downloadDurationSeconds: result?.downloadDurationSeconds ?? 0,
            parseDurationSeconds: result?.parseDurationSeconds ?? 0,
            parser: result?.parser ?? fileInfo.performanceData?.parser,
            versionId: result?.versionId ?? fileInfo.performanceData?.versionId
          }
        }
      })
    } catch (e) {
      const err = ensureError(e)
      boundLogger.error(
        { err, info: { fileId: blobId } },
        'Error updating imported file status in database. File ID: {fileId}'
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

    return true
  }
