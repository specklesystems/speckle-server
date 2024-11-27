import {
  DeleteBlob,
  GetBlobMetadata,
  StoreFileStream,
  UpdateBlob,
  UploadFileStream,
  UpsertBlob
} from '@/modules/blobstorage/domain/operations'
import { BlobStorageItem } from '@/modules/blobstorage/domain/types'
import { BadRequestError } from '@/modules/shared/errors'
import { getFileSizeLimitMB } from '@/modules/shared/helpers/envHelper'
import { MaybeAsync } from '@speckle/shared'

/**
 * File size limit in bytes
 */
export const getFileSizeLimit = () => getFileSizeLimitMB() * 1024 * 1024

export const uploadFileStreamFactory =
  (deps: {
    upsertBlob: UpsertBlob
    updateBlob: UpdateBlob
    storeFileStream: StoreFileStream
  }): UploadFileStream =>
  async (params1, params2) => {
    const { streamId, userId } = params1
    const { blobId, fileName, fileType, fileStream } = params2

    if (streamId.length !== 10)
      throw new BadRequestError('The stream id has to be of length 10')
    if (!userId || userId.length !== 10)
      throw new BadRequestError('The user id has to be of length 10')

    const objectKey = `assets/${streamId}/${blobId}`
    const dbFile = {
      id: blobId,
      streamId,
      userId,
      objectKey,
      fileName,
      fileType
    }
    // need to insert the upload data before starting otherwise the upload finished
    // even might fire faster, than the db insert, causing missing asset data in the db
    await deps.upsertBlob(dbFile)

    const { fileHash } = await deps.storeFileStream({ objectKey, fileStream })

    // here we should also update the blob db record with the fileHash
    await deps.updateBlob({ id: blobId, item: { fileHash } })

    return { blobId, fileName, fileHash }
  }

export const getFileStreamFactory =
  (deps: { getBlobMetadata: GetBlobMetadata }) =>
  async <
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    StreamGetter extends (args: ObjectKeyPayload) => MaybeAsync<any>
  >(params: {
    blobId: string
    streamId: string
    getObjectStream: StreamGetter
  }): Promise<Awaited<ReturnType<StreamGetter>>> => {
    const { blobId, streamId, getObjectStream } = params

    const { objectKey } = await deps.getBlobMetadata({ blobId, streamId })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await getObjectStream({ objectKey: objectKey! })
  }

type UpdateBlobMetadataDeps = {
  getBlobMetadata: GetBlobMetadata
  updateBlob: UpdateBlob
}

const updateBlobMetadataFactory =
  (deps: UpdateBlobMetadataDeps) =>
  async (
    streamId: string,
    blobId: string,
    updateCallback: (params: ObjectKeyPayload) => MaybeAsync<Partial<BlobStorageItem>>
  ) => {
    const { objectKey, fileName } = await deps.getBlobMetadata({
      streamId,
      blobId
    })
    const updateData = await updateCallback({ objectKey: objectKey! })
    await deps.updateBlob({ id: blobId, item: updateData, streamId })
    return { blobId, fileName, ...updateData }
  }

export const markUploadSuccessFactory =
  (deps: UpdateBlobMetadataDeps) =>
  async (
    getObjectAttributes: (params: ObjectKeyPayload) => MaybeAsync<{ fileSize: number }>,
    streamId: string,
    blobId: string
  ) => {
    const updateBlobMetadata = updateBlobMetadataFactory(deps)
    return await updateBlobMetadata(streamId, blobId, async ({ objectKey }) => {
      const { fileSize } = await getObjectAttributes({ objectKey })
      return { uploadStatus: 1, fileSize }
    })
  }

type ObjectKeyPayload = { objectKey: string }
type DeleteObjectFromStorage = (params: ObjectKeyPayload) => MaybeAsync<void>

export const markUploadErrorFactory =
  (deps: UpdateBlobMetadataDeps) =>
  async (
    deleteObject: DeleteObjectFromStorage,
    streamId: string,
    blobId: string,
    error: string
  ) => {
    const updateBlobMetadata = updateBlobMetadataFactory(deps)
    return await updateBlobMetadata(streamId, blobId, async ({ objectKey }) => {
      await deleteObject({ objectKey })
      return { uploadStatus: 2, uploadError: error }
    })
  }

export const markUploadOverFileSizeLimitFactory =
  (deps: UpdateBlobMetadataDeps) =>
  async (deleteObject: DeleteObjectFromStorage, streamId: string, blobId: string) => {
    const markUploadError = markUploadErrorFactory(deps)
    return await markUploadError(
      deleteObject,
      streamId,
      blobId,
      'File size limit reached'
    )
  }

export const fullyDeleteBlobFactory =
  (deps: { getBlobMetadata: GetBlobMetadata; deleteBlob: DeleteBlob }) =>
  async ({
    streamId,
    blobId,
    deleteObject
  }: {
    streamId: string
    blobId: string
    deleteObject: (params: ObjectKeyPayload) => MaybeAsync<void>
  }) => {
    const { objectKey } = await deps.getBlobMetadata({
      streamId,
      blobId
    })
    await deleteObject({ objectKey: objectKey! })
    await deps.deleteBlob({ id: blobId, streamId })
  }
