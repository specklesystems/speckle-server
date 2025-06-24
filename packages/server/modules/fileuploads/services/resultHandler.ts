import type { Logger } from '@/observability/logging'
import {
  GetFileInfoV2,
  ProcessFileImportResult,
  UpdateFileUpload
} from '@/modules/fileuploads/domain/operations'
import {
  FileImportSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import {
  ProjectFileImportUpdatedMessageType,
  ProjectPendingVersionsUpdatedMessageType
} from '@/test/graphql/generated/graphql'
import {
  jobResultStatusToFileUploadStatus,
  jobResultToConvertedMessage
} from '@/modules/fileuploads/helpers/convert'
import { ensureError } from '@speckle/shared'
import type { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import { ObserveResult } from '@/modules/fileuploads/observability/metrics'
import { FileImportJobNotFoundError } from '@/modules/fileuploads/helpers/errors'

type OnFileImportResultDeps = {
  getFileInfo: GetFileInfoV2
  updateFileUpload: UpdateFileUpload
  publish: PublishSubscription
  observeResult?: ObserveResult
  logger: Logger
}

export const onFileImportResultFactory =
  (deps: OnFileImportResultDeps): ProcessFileImportResult =>
  async (params) => {
    const { logger, observeResult } = deps
    const { jobId, jobResult } = params

    if (observeResult) observeResult({ jobResult })

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
    switch (jobResult.status) {
      case 'error':
        boundLogger.warn(
          {
            duration: jobResult.result.durationSeconds,
            err: { message: jobResult.reason }
          },
          'Processing error result for file upload'
        )
        break
      case 'success':
        convertedCommitId = jobResult.result.versionId
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

    let updatedFile: FileUploadRecord
    try {
      updatedFile = await deps.updateFileUpload({
        id: jobId,
        upload: {
          convertedStatus: status,
          convertedLastUpdate: new Date(),
          convertedMessage,
          convertedCommitId
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

    await deps.publish(FileImportSubscriptions.ProjectPendingVersionsUpdated, {
      projectPendingVersionsUpdated: {
        id: updatedFile.id,
        type: ProjectPendingVersionsUpdatedMessageType.Updated,
        version: updatedFile
      },
      projectId: updatedFile.streamId,
      branchName: updatedFile.branchName
    })

    await deps.publish(FileImportSubscriptions.ProjectFileImportUpdated, {
      projectFileImportUpdated: {
        id: updatedFile.id,
        type: ProjectFileImportUpdatedMessageType.Updated,
        upload: updatedFile
      },
      projectId: updatedFile.streamId
    })

    logger.info('File upload status updated')
  }
