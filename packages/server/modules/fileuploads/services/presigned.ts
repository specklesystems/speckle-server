import { RegisterCompletedUpload } from '@/modules/blobstorage/domain/operations'
import { GetBranchesByIds } from '@/modules/core/domain/branches/operations'
import {
  GetFileInfoV2,
  InsertNewUploadAndNotify,
  InsertNewUploadAndNotifyV2,
  RegisterUploadCompleteAndStartFileImport
} from '@/modules/fileuploads/domain/operations'
import { ModelNotFoundError } from '@/modules/core/errors/model'
import { ensureError } from '@speckle/shared'
import { FileImportJobNotFoundError } from '@/modules/fileuploads/helpers/errors'
import { get } from 'lodash-es'

export const registerUploadCompleteAndStartFileImportFactory = (deps: {
  registerCompletedUpload: RegisterCompletedUpload
  insertNewUploadAndNotify: InsertNewUploadAndNotifyV2 | InsertNewUploadAndNotify
  getModelsByIds: GetBranchesByIds
  getFileInfo: GetFileInfoV2
}): RegisterUploadCompleteAndStartFileImport => {
  const {
    registerCompletedUpload,
    insertNewUploadAndNotify,
    getModelsByIds,
    getFileInfo
  } = deps
  return async (params) => {
    const { projectId, modelId, fileId, userId, expectedETag, maximumFileSize } = params
    const storedBlob = await registerCompletedUpload({
      projectId,
      blobId: fileId,
      expectedETag,
      maximumFileSize
    })

    const [model] = await getModelsByIds([modelId], { streamId: projectId })
    if (!model) throw new ModelNotFoundError(undefined)

    try {
      const storedFile = await insertNewUploadAndNotify({
        projectId: storedBlob.streamId,
        streamId: storedBlob.streamId, //backwards compatibility
        userId,
        fileName: storedBlob.fileName,
        fileType: storedBlob.fileType,
        fileSize: storedBlob.fileSize,
        fileId: storedBlob.id,
        modelId,
        modelName: model.name,
        branchName: model.name //backwards compatibility
      })

      return {
        ...storedFile,
        modelName: model.name,
        projectId: storedBlob.streamId //backwards compatibility
      }
    } catch (error) {
      const message = get(error, 'message')
      if (
        message &&
        typeof message === 'string' &&
        message.includes(
          'duplicate key value violates unique constraint "file_uploads_pkey"'
        )
      ) {
        // The file import record already exists, so we try to return the existing file info
        const storedFile = await getFileInfo({
          fileId,
          projectId
        })
        if (!storedFile) {
          // Possible that the file id exists, hence the duplicate key error.
          // But we cannot retrieve the file info for the given projectId.
          // This can happen if the file was uploaded to a different project.
          // we do not want to leak the file info, so throw an error
          throw new FileImportJobNotFoundError(
            'File import job not found for the given fileId and projectId'
          )
        }
        return { ...storedFile, modelName: model.name }
      }

      throw ensureError(
        error,
        'Unexpected error while registering upload of a file as complete and requesting the file import to start.'
      )
    }
  }
}
