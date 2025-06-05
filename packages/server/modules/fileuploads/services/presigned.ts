import { RegisterCompletedUpload } from '@/modules/blobstorage/domain/operations'
import { GetBranchesByIds } from '@/modules/core/domain/branches/operations'
import {
  InsertNewUploadAndNotify,
  RegisterUploadCompleteAndStartFileImport
} from '@/modules/fileuploads/domain/operations'
import { ModelNotFoundError } from '@/modules/core/errors/model'

export const registerUploadCompleteAndStartFileImportFactory = (deps: {
  registerCompletedUpload: RegisterCompletedUpload
  insertNewUploadAndNotify: InsertNewUploadAndNotify
  getModelsByIds: GetBranchesByIds
}): RegisterUploadCompleteAndStartFileImport => {
  const { registerCompletedUpload, insertNewUploadAndNotify, getModelsByIds } = deps
  return async (params) => {
    const { projectId, modelId, blobId, userId, expectedETag, maximumFileSize } = params
    const storedBlob = await registerCompletedUpload({
      projectId,
      blobId,
      expectedETag,
      maximumFileSize
    })

    const [model] = await getModelsByIds([modelId], { streamId: projectId })
    if (!model) throw new ModelNotFoundError(undefined)

    const storedFile = await insertNewUploadAndNotify({
      projectId: storedBlob.streamId,
      userId,
      fileName: storedBlob.fileName,
      fileType: storedBlob.fileType,
      fileSize: storedBlob.fileSize,
      fileId: storedBlob.id,
      modelId,
      modelName: model.name
    })

    return { ...storedFile, modelName: model.name }
  }
}
