import type { Logger } from '@/observability/logging'
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
import { ensureError, TIME } from '@speckle/shared'
import type { FileUploadRecord } from '@/modules/fileuploads/helpers/types'
import { FileImportJobDurationStep } from '@/modules/fileuploads/observability/metrics'

type OnFileImportResultDeps = {
  updateFileUpload: UpdateFileUpload
  publish: PublishSubscription
  logger: Logger
}

export const onFileImportResultFactory =
  (deps: OnFileImportResultDeps): ProcessFileImportResult =>
  async (params) => {
    const { logger } = deps
    const { jobId, jobResult, metricsSummary } = params

    metricsSummary?.observe(
      {
        parser: jobResult.result.parser,
        status: jobResult.status,
        step: FileImportJobDurationStep.TOTAL
      },
      jobResult.result.durationSeconds * TIME.second
    )

    if (jobResult.result.downloadDurationSeconds) {
      metricsSummary?.observe(
        {
          parser: jobResult.result.parser,
          status: jobResult.status,
          step: FileImportJobDurationStep.DOWNLOAD
        },
        jobResult.result.downloadDurationSeconds * TIME.second
      )
    }

    if (jobResult.result.parseDurationSeconds) {
      metricsSummary?.observe(
        {
          parser: jobResult.result.parser,
          status: jobResult.status,
          step: FileImportJobDurationStep.PARSE
        },
        jobResult.result.parseDurationSeconds * TIME.second
      )
    }

    let convertedCommitId = null
    switch (jobResult.status) {
      case 'error':
        logger.warn(
          {
            duration: jobResult.result.durationSeconds,
            err: { message: jobResult.reason }
          },
          'Processing error result for file upload'
        )
        break
      case 'success':
        convertedCommitId = jobResult.result.versionId
        logger.info(
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
