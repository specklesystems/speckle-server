import type {
  GeneratePresignedUrl,
  GetBlobMetadataFromStorage,
  RegisterCompletedUpload,
  GetSignedUrl,
  UpdateBlob,
  UpsertBlob
} from '@/modules/blobstorage/domain/operations'
import { getObjectKey } from '@/modules/blobstorage/helpers/blobs'
import { UserInputError } from '@/modules/core/errors/userinput'
import { BlobUploadStatus } from '@/modules/blobstorage/domain/types'
import { Logger } from '@/observability/logging'
import { ensureError, Optional } from '@speckle/shared'
import { StoredBlobAccessError } from '@/modules/blobstorage/errors'
// import { acceptedFileExtensions } from '@speckle/shared'

export const generatePresignedUrlFactory =
  (deps: {
    getSignedUrl: GetSignedUrl
    upsertBlob: UpsertBlob
  }): GeneratePresignedUrl =>
  async (params) => {
    const { getSignedUrl, upsertBlob } = deps
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
      objectKey,
      urlExpiryDurationSeconds
    })
    return url
  }

export const registerCompletedUploadFactory =
  (deps: {
    updateBlob: UpdateBlob
    getBlobMetadata: GetBlobMetadataFromStorage
    logger: Logger
  }): RegisterCompletedUpload =>
  async (params) => {
    const { updateBlob, getBlobMetadata, logger } = deps
    const { blobId, projectId, expectedETag } = params
    if (!expectedETag) {
      throw new UserInputError('ETag is required to register a completed upload')
    }

    const objectKey = getObjectKey(projectId, blobId)
    let blobMetadata: { eTag: Optional<string>; contentLength: Optional<number> }
    try {
      blobMetadata = await getBlobMetadata({
        objectKey
      })
    } catch (e) {
      throw new StoredBlobAccessError(
        `Failed to get blob metadata for blob ${blobId} in project ${projectId}`,
        { cause: ensureError(e, 'Failed to get blob metadata from storage') }
      )
    }

    if (blobMetadata.eTag !== expectedETag) {
      logger.warn(
        `ETag mismatch for blob ${blobId} in project ${projectId}: expected ${expectedETag}, got ${blobMetadata.eTag}`
      )
      // we don't want to leak the actual ETag to the user for security reasons, but we log it for debugging purposes
      throw new UserInputError(`ETag mismatch: expected ${expectedETag}`)
    }

    return await updateBlob({
      id: blobId,
      streamId: projectId,
      item: {
        uploadStatus: BlobUploadStatus.Completed,
        fileSize: blobMetadata.contentLength,
        fileHash: blobMetadata.eTag //FIXME verify if this is the correct field to use. Is the etag the file hash? Or should we use `ChecksumSHA256` or similar?
      }
    })
  }
