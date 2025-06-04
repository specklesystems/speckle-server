import type {
  GeneratePresignedUrl,
  UpsertBlob
} from '@/modules/blobstorage/domain/operations'
import type {
  GetSignedUrl,
  ObjectStorage
} from '@/modules/blobstorage/clients/objectStorage'
import { getObjectKey } from '@/modules/blobstorage/helpers/blobs'
import { UserInputError } from '@/modules/core/errors/userinput'
// import { acceptedFileExtensions } from '@speckle/shared'

export const generatePresignedUrlFactory =
  (deps: {
    objectStorage: ObjectStorage
    getSignedUrl: GetSignedUrl
    upsertBlob: UpsertBlob
  }): GeneratePresignedUrl =>
  async (params) => {
    const { objectStorage, getSignedUrl, upsertBlob } = deps
    const { projectId, userId, blobId, fileName, urlExpiryDurationSeconds } = params

    const fileType = fileName.split('.').pop()
    if (!fileType || fileType === fileName) {
      throw new UserInputError('File name must have a valid extension')
    }
    //TODO get all image/* & video/* types from https://github.com/jshttp/mime-db
    // and include extensions for those types
    // if (!acceptedFileExtensions.includes(fileType)) {
    //   throw new UserInputError(
    //     `File type "${fileType}" is not supported. Supported types are: ${acceptedFileExtensions.join(
    //       ', '
    //     )}`
    //   )
    // }

    const objectKey = getObjectKey(projectId, blobId)

    const dbFile = {
      id: blobId,
      streamId: projectId,
      userId,
      objectKey,
      fileName,
      fileType
    }

    // need to insert the upload data before providing the url
    // otherwise we may end up with dangling blobs in the object storage
    // with no metadata in the database; this could make garbage collection hard
    await upsertBlob(dbFile)
    const url = getSignedUrl({
      objectStorage,
      objectKey,
      urlExpiryDurationSeconds
    })
    return url
  }
