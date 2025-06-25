import { Logger } from '@/observability/logging'
import {
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
import { FileUploadRecord } from '@/modules/fileuploads/helpers/types'

type OnFileImportResultDeps = {
  updateFileUpload: UpdateFileUpload
  publish: PublishSubscription
  logger: Logger
}

export const onFileImportResultFactory =
  (deps: OnFileImportResultDeps): ProcessFileImportResult =>
  async (params) => {
    const { logger } = deps
    const { jobId, jobResult } = params

    logger.info('Processing result for file upload')

    const status = jobResultStatusToFileUploadStatus(jobResult.status)
    const convertedMessage = jobResultToConvertedMessage(jobResult)

    let convertedCommitId = null
    switch (jobResult.status) {
      case 'error':
        break
      case 'success':
        convertedCommitId = jobResult.result.versionId
    }

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
