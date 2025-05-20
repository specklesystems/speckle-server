import { Logger } from '@/observability/logging'
import {
  ProcessFileImportResult,
  UpdateFileStatus
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

type OnFileImportResultDeps = {
  updateFileStatus: UpdateFileStatus
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

    let updatedFile
    try {
      updatedFile = await deps.updateFileStatus({
        fileId: jobId,
        status,
        convertedMessage
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
