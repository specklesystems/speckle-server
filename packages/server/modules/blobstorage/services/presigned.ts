import type {
  GeneratePresignedUrl,
  UpsertBlob
} from '@/modules/blobstorage/domain/operations'
import type {
  GetSignedUrl,
  ObjectStorage
} from '@/modules/blobstorage/clients/objectStorage'
import { getObjectKey } from '@/modules/blobstorage/helpers/blobs'

export const generatePresignedUrlFactory =
  (deps: {
    objectStorage: ObjectStorage
    getSignedUrl: GetSignedUrl
    upsertBlob: UpsertBlob
  }): GeneratePresignedUrl =>
  async (params) => {
    const { objectStorage, getSignedUrl, upsertBlob } = deps
    const { projectId, userId, blobId, fileName, urlExpiryDurationSeconds } = params

    //TODO validate the filename (has a suffix which is an accepted file type)

    const objectKey = getObjectKey(projectId, blobId)

    const dbFile = {
      id: blobId,
      streamId: projectId,
      userId,
      objectKey,
      fileName
    }

    // need to insert the upload data before providing the url
    // otherwise we may end up with dangling blobs in the object storage
    // with no metadata in the database; this could make garbage collection hard
    await upsertBlob(dbFile)
    return getSignedUrl({
      objectStorage,
      objectKey,
      urlExpiryDurationSeconds
    })
  }
