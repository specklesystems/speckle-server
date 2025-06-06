import type {
  GeneratePresignedUrl,
  GetBlobMetadataFromStorage,
  RegisterCompletedUpload,
  GetSignedUrl,
  UpdateBlob,
  UpsertBlob,
  GetBlobs
} from '@/modules/blobstorage/domain/operations'
import { getObjectKey } from '@/modules/blobstorage/helpers/blobs'
import { UserInputError } from '@/modules/core/errors/userinput'
import { BlobUploadStatus } from '@/modules/blobstorage/domain/types'
import { Logger } from '@/observability/logging'
import { ensureError, Optional } from '@speckle/shared'
import { StoredBlobAccessError } from '@/modules/blobstorage/errors'
import { isEmpty } from 'lodash'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
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
    getBlobs: GetBlobs
    getBlobMetadata: GetBlobMetadataFromStorage
    updateBlobWhereStatusPending: UpdateBlob
    logger: Logger
  }): RegisterCompletedUpload =>
  async (params) => {
    const { getBlobs, updateBlobWhereStatusPending, getBlobMetadata, logger } = deps
    const { blobId, projectId, expectedETag, maximumFileSize } = params
    if (isEmpty(expectedETag)) {
      throw new UserInputError('ETag is required to register a completed upload')
    }
    if (maximumFileSize <= 0) {
      throw new MisconfiguredEnvironmentError(
        'Maximum file size must be greater than 0'
      )
    }

    const existingBlobs = await getBlobs({
      streamId: projectId,
      blobIds: [blobId]
    })
    if (!existingBlobs || existingBlobs.length === 0) {
      throw new UserInputError(
        'Please use mutation generateUploadUrl to create a blob before registering a completed upload'
      )
    }

    // If the blob already exists and is not pending, we can return it directly as it has already been registered
    if (existingBlobs[0].uploadStatus !== BlobUploadStatus.Pending) {
      return existingBlobs[0]
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

      // we don't know enough to mark the upload as failed (maybe this is just the client getting confused about the etag or blobId)

      // we don't want to leak the actual ETag to the user; it's the proof of the upload
      throw new UserInputError(`ETag mismatch: expected ${expectedETag}`)
    }

    if (!blobMetadata.contentLength || blobMetadata.contentLength > maximumFileSize) {
      await updateBlobWhereStatusPending({
        id: blobId,
        streamId: projectId,
        item: {
          uploadStatus: BlobUploadStatus.Error,
          uploadError:
            '[FILE_SIZE_EXCEEDED] File size exceeds maximum allowed size for the project at the time of upload',
          fileSize: blobMetadata.contentLength,
          fileHash: blobMetadata.eTag
        }
      })
      throw new UserInputError(
        `File size exceeds maximum allowed size of ${maximumFileSize} bytes. Actual size: ${blobMetadata.contentLength} bytes`
      )
    }

    const updatedBlob = await updateBlobWhereStatusPending({
      id: blobId,
      streamId: projectId,
      item: {
        uploadStatus: BlobUploadStatus.Completed,
        fileSize: blobMetadata.contentLength,
        fileHash: blobMetadata.eTag
      }
    })
    return updatedBlob
  }
