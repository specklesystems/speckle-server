import { Logger } from '@/observability/logging'
import {
  FileIdFromJobId,
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
import { jobResultStatusToFileUploadStatus } from '@/modules/fileuploads/helpers/convert'

type OnFileImportResultDeps = {
  getFileIdFromJobId: FileIdFromJobId
  updateFileStatus: UpdateFileStatus
  publish: PublishSubscription
  logger: Logger
}

export const onFileImportResultFactory =
  (deps: OnFileImportResultDeps): ProcessFileImportResult =>
  async (params) => {
    const { logger: parentLogger } = deps
    const { jobId, jobResult } = params

    parentLogger.info('Processing result for file upload')

    const fileId = await deps.getFileIdFromJobId({ jobId })

    if (!fileId) {
      parentLogger.error('Could not find fileId for jobId')
      return
    }

    const logger = parentLogger.child({
      fileId
    })

    const status = jobResultStatusToFileUploadStatus(jobResult.status)
    let messages = []
    switch (jobResult.status) {
      case 'success':
        messages = jobResult.warnings
        break
      case 'error':
        messages = jobResult.reasons
        break
      default:
        throw new Error('Unknown job result status')
    }

    const updatedFile = await deps.updateFileStatus({
      fileId,
      status,
      convertedMessage: messages.join(', ')
    })

    logger.info('File upload status updated')

    //FIXME why both?
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
  }
