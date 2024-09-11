import { UpdateBlob, UpsertBlob } from '@/modules/blobstorage/domain/operations'
import { BadRequestError } from '@/modules/shared/errors'

export const uploadFileStreamFactory =
  (deps: { upsertBlob: UpsertBlob; updateBlob: UpdateBlob }) =>
  async (
    storeFileStream: (params: {
      objectKey: string
      fileStream: Buffer
    }) => Promise<{ fileHash: string }>,
    params1: { streamId: string; userId: string },
    params2: { blobId: string; fileName: string; fileType: string; fileStream: Buffer }
  ) => {
    const { streamId, userId } = params1
    const { blobId, fileName, fileType, fileStream } = params2

    if (streamId.length !== 10)
      throw new BadRequestError('The stream id has to be of length 10')
    if (userId.length !== 10)
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

    const { fileHash } = await storeFileStream({ objectKey, fileStream })

    // here we should also update the blob db record with the fileHash
    await deps.updateBlob({ id: blobId, item: { fileHash } })

    return { blobId, fileName, fileHash }
  }
