import type {
  GetFileInfo,
  UpdateFileUpload
} from '@/modules/fileuploads/domain/operations'
import type { GetStreamBranchByName } from '@/modules/core/domain/branches/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { ModelEvents } from '@/modules/core/domain/branches/events'
import { fileUploadsLogger as logger } from '@/observability/logging'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import { FileUploadInternalError } from '@/modules/fileuploads/helpers/errors'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'

type OnFileImportProcessedDeps = {
  getFileInfo: GetFileInfo
  getStreamBranchByName: GetStreamBranchByName
  updateFileUpload: UpdateFileUpload
  eventEmit: EventBusEmit
}

type ParsedMessage = {
  uploadId: string | null
  streamId: string | null
  branchName: string | null
  isNewBranch: boolean
}
const branchCreatedPayloadRegexp = /^(.+?):::(.*?):::(.*?):::(.*?)$/i
export const parseMessagePayload = (payload: string | undefined): ParsedMessage => {
  const [, uploadId, streamId, branchName, newBranchCreated] =
    branchCreatedPayloadRegexp.exec(payload || '') || [null, null, null, null]

  const isNewBranch = newBranchCreated === '1'
  return { uploadId, streamId, branchName, isNewBranch }
}

export const onFileImportProcessedFactory =
  (deps: OnFileImportProcessedDeps) =>
  async ({ uploadId, streamId, branchName, isNewBranch }: ParsedMessage) => {
    if (!uploadId || !streamId || !branchName) return
    let boundLogger = logger.child({ streamId, projectId: streamId, uploadId })

    const [upload, branch] = await Promise.all([
      deps.getFileInfo({ fileId: uploadId }),
      deps.getStreamBranchByName(streamId, branchName)
    ])
    if (!upload) return
    if (upload.streamId !== streamId) return

    boundLogger = boundLogger.child({
      modelId: upload.modelId,
      branchId: upload.modelId,
      branchName: upload.branchName,
      fileImportDetails: upload
    })

    // Update upload to reference the actual model/branch created
    if (branch) {
      await deps.updateFileUpload({
        id: upload.id,
        upload: {
          modelId: branch.id
        }
      })
    }

    if (upload.convertedStatus === FileUploadConvertedStatus.Error) {
      //TODO in future differentiate between internal server errors and user errors
      const err = new FileUploadInternalError(
        upload.convertedMessage || 'Unknown error while uploading file.'
      )
      boundLogger.warn({ err }, 'Error while processing file upload.')
    } else {
      boundLogger.info('File upload processed.')
    }

    await deps.eventEmit({
      eventName: FileuploadEvents.Updated,
      payload: {
        upload: {
          ...upload,
          projectId: upload.streamId
        },
        isNewModel: isNewBranch
      }
    })

    if (branch && isNewBranch) {
      await deps.eventEmit({
        eventName: ModelEvents.Created,
        payload: { model: branch, projectId: branch.streamId }
      })
    }
  }

type OnFileProcessingDeps = {
  getFileInfo: GetFileInfo
  emitEvent: EventBusEmit
}

export const onFileProcessingFactory =
  (deps: OnFileProcessingDeps) =>
  async ({ uploadId, streamId }: ParsedMessage) => {
    if (!uploadId) return
    const upload = await deps.getFileInfo({ fileId: uploadId })
    if (!upload) return
    if (upload.streamId !== streamId) return

    await deps.emitEvent({
      eventName: FileuploadEvents.Updated,
      payload: {
        upload: {
          ...upload,
          projectId: upload.streamId
        },
        isNewModel: !upload.modelId
      }
    })
  }
