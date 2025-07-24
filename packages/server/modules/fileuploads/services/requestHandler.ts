import type { Logger } from '@/observability/logging'
import type { ActiveEventCallback, ErrorEventCallback, FailedEventCallback } from 'bull'
import type { UpdateFileStatusForProjectFactory } from '@/modules/fileuploads/domain/operations'
import type { JobPayload } from '@speckle/shared/workers/fileimport'
import { FileUploadConvertedStatus } from '@speckle/shared/blobs'
import { ensureError } from '@speckle/shared'

export const requestActiveHandlerFactory =
  (deps: {
    logger: Logger
    updateFileStatusBuilder: UpdateFileStatusForProjectFactory
  }): ActiveEventCallback<JobPayload> =>
  async (job) => {
    deps.logger.info(
      {
        jobId: job.id,
        projectId: job.data.projectId,
        streamId: job.data.projectId, //legacy
        fileName: job.data.fileName,
        fileType: job.data.fileType,
        blobId: job.data.blobId,
        modelId: job.data.modelId
      },
      "File import job for file '${fileName}' accepted for project '${projectId} with file type '${fileType}'; updating status to 'Converting'."
    )
    const updateFileStatus = await deps.updateFileStatusBuilder({
      projectId: job.data.projectId
    })
    await updateFileStatus({
      fileId: job.data.blobId,
      projectId: job.data.projectId,
      status: FileUploadConvertedStatus.Converting,
      convertedMessage: 'File import job accepted and converting started',
      convertedCommitId: null
    })
  }

export const requestErrorHandlerFactory =
  (deps: { logger: Logger }): ErrorEventCallback =>
  (e) => {
    const err = ensureError(
      e,
      'File import job errored for unknown reason, likely a Redis, networking, or application configuration problem'
    )
    deps.logger.error({ err }, 'File import job errored (likely a Redis problem)')
    // we do not have details about the job here, so we cannot update the file upload status
  }

export const requestFailedHandlerFactory =
  (deps: {
    logger: Logger
    updateFileStatusForProjectFactory: UpdateFileStatusForProjectFactory
  }): FailedEventCallback<JobPayload> =>
  async (job, e) => {
    const err = ensureError(
      e,
      'File import job failed for an unknown reason. This may occur if the worker was killed, memory was exhausted, or a bug in the parsing of the file occurred which caused the worker to crash.'
    )
    deps.logger.warn(
      {
        error: err,
        jobId: job.id,
        projectId: job.data.projectId,
        streamId: job.data.projectId, //legacy
        fileType: job.data.fileType,
        fileName: job.data.fileName,
        blobId: job.data.blobId,
        modelId: job.data.modelId
      },
      "File import job for file '${fileName}' failed for ${projectId} with file type ${fileType}. Updating status to 'Error'."
    )
    const updateFileStatus = await deps.updateFileStatusForProjectFactory({
      projectId: job.data.projectId
    })

    await updateFileStatus({
      fileId: job.data.blobId,
      projectId: job.data.projectId,
      status: FileUploadConvertedStatus.Error,
      convertedMessage: err.message,
      convertedCommitId: null
    })
  }
