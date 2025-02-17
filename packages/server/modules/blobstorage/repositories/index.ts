import {
  DeleteBlob,
  GetBlobMetadata,
  GetBlobMetadataCollection,
  GetBlobs,
  UpdateBlob,
  UpsertBlob
} from '@/modules/blobstorage/domain/operations'
import {
  BlobStorageItem,
  BlobStorageItemInput
} from '@/modules/blobstorage/domain/types'
import { cursorFromRows, decodeCursor } from '@/modules/blobstorage/helpers/db'
import { buildTableHelper } from '@/modules/core/dbSchema'
import {
  BadRequestError,
  NotFoundError,
  ResourceMismatch
} from '@/modules/shared/errors'
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
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

export const upsertBlobFactory =
  (deps: { db: Knex }): UpsertBlob =>
  async (item: BlobStorageItemInput) => {
    const [res] = await tables
      .blobStorage(deps.db)
      .insert(item)
      .onConflict(['id', 'streamId'])
      .ignore()
      .returning('*')
    return res
  }

export const deleteBlobFactory =
  (deps: { db: Knex }): DeleteBlob =>
  async (params: { id: string; streamId?: string }) => {
    const q = tables.blobStorage(deps.db).where(BlobStorage.col.id, params.id)
    if (params.streamId) q.andWhere(BlobStorage.col.streamId, params.streamId)
    return await q.del()
  }

export const updateBlobFactory =
  (deps: { db: Knex }): UpdateBlob =>
  async (params: { id: string; item: Partial<BlobStorageItem>; streamId?: string }) => {
    const { id, item, streamId } = params
    const q = tables
      .blobStorage(deps.db)
      .where(BlobStorage.col.id, id)
      .update(item, '*')

    if (streamId) q.andWhere(BlobStorage.col.streamId, streamId)

    const [res] = await q
    return res
  }

export const getBlobMetadataFactory =
  (deps: { db: Knex }): GetBlobMetadata =>
  async (params: { blobId: string; streamId: string }) => {
    const { blobId, streamId } = params

    if (!streamId) throw new BadRequestError('No steamId provided')
    const obj =
      (await tables
        .blobStorage(deps.db)
        .where({ [BlobStorage.col.id]: blobId, [BlobStorage.col.streamId]: streamId })
        .first()) || null

    if (!obj) throw new NotFoundError(`The requested asset: ${blobId} doesn't exist`)
    if (obj.streamId !== streamId)
      throw new ResourceMismatch("The stream doesn't have the given resource")

    return obj
  }

export const getBlobMetadataCollectionFactory =
  (deps: { db: Knex }): GetBlobMetadataCollection =>
  async ({ streamId, query = null, limit = 25, cursor = null }) => {
    const cursorTarget = 'createdAt'
    const limitMax = 25
    const queryLimit = limit && limit < limitMax ? limit : limitMax
    const blobs = tables
      .blobStorage(deps.db)
      .where({ [BlobStorage.col.streamId]: streamId })
      .orderBy(cursorTarget, 'desc')
      .limit(queryLimit)

    if (query) blobs.andWhereLike('fileName', `%${query}%`)
    if (cursor) blobs.andWhere(cursorTarget, '<', decodeCursor(cursor))

    const rows = await blobs
    return {
      blobs: rows,
      cursor: cursorFromRows(rows, cursorTarget)
    }
  }

export const blobCollectionSummaryFactory =
  (deps: { db: Knex }) =>
  async (params: { streamId: string; query?: MaybeNullOrUndefined<string> }) => {
    const { streamId, query } = params

    const q = tables
      .blobStorage(deps.db)
      .where({ [BlobStorage.col.streamId]: streamId })
      .sum('fileSize')
      .count('id')

    if (query) q.andWhereLike('fileName', `%${query}%`)

    const [summary] = (await q) as unknown as Array<{
      sum: Nullable<string>
      count: string
    }>

    return {
      totalSize: summary.sum ? parseInt(summary.sum) : 0,
      totalCount: parseInt(summary.count)
    }
  }
