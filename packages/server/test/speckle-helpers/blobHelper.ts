import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { storeFileStreamFactory } from '@/modules/blobstorage/repositories/blobs'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import cryptoRandomString from 'crypto-random-string'

const image =
  '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'

export const createTestBlob = async (params: { userId: string; projectId: string }) => {
  const { userId, projectId } = params

  const [projectDb, projectStorage] = await Promise.all([
    getProjectDbClient({ projectId }),
    getProjectObjectStorage({ projectId })
  ])

  const blobId = cryptoRandomString({ length: 10 })
  const blob = Buffer.from(image, 'base64')

  return await uploadFileStreamFactory({
    upsertBlob: upsertBlobFactory({ db: projectDb }),
    updateBlob: updateBlobFactory({ db: projectDb }),
    storeFileStream: storeFileStreamFactory({ storage: projectStorage })
  })(
    {
      userId,
      streamId: projectId
    },
    {
      blobId,
      fileName: cryptoRandomString({ length: 10 }),
      fileType: 'jpg',
      fileStream: blob
    }
  )
}
