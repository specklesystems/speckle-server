import { GetBlobs } from '@/modules/blobstorage/domain/operationts'
import { BlobStorageItem } from '@/modules/blobstorage/domain/types'
import { buildTableHelper } from '@/modules/core/dbSchema'
import { Knex } from 'knex'

const BlobStorage = buildTableHelper('blob_storage', [
  'id',
  'streamId',
  'userId',
  'objectKey',
  'fileName',
  'fileType',
  'fileSize',
  'uploadStatus',
  'uploadError',
  'createdAt',
  'fileHash'
])

const tables = {
  blobStorage: (db: Knex) => db<BlobStorageItem>(BlobStorage.name)
}

/**
 * Get blobs - use only internally, as this doesn't require a streamId
 */
export const getBlobsFactory =
  (deps: { db: Knex }): GetBlobs =>
  async (params) => {
    const { streamId, blobIds } = params

    const q = tables.blobStorage(deps.db).whereIn('id', blobIds)
    if (streamId) {
      q.andWhere('streamId', streamId)
    }

    return await q
  }

export const getAllStreamBlobIdsFactory =
  (deps: { db: Knex }) => async (params: { streamId: string }) => {
    const { streamId } = params
    const res = await tables.blobStorage(deps.db).where({ streamId }).select('id')
    return res
  }
