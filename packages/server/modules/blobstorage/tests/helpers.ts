/* istanbul ignore file */
import crs from 'crypto-random-string'
import { range } from 'lodash'
import { knex } from '@/db/knex'

const BlobStorage = () => knex('blob_storage')

export const fakeIdGenerator = () => crs({ length: 10 })

export const createBlobs = async ({
  streamId,
  number,
  fileSize = 1
}: {
  streamId: string
  number: number
  fileSize?: number
}) =>
  await Promise.all(
    range(number).map(async (num) => {
      const id = fakeIdGenerator()
      const dbFile = {
        id: `${num}`.padStart(10, '0'),
        streamId,
        userId: id,
        objectKey: id,
        fileName: `${id}.${`${num}`.padStart(10, '0')}`,
        fileType: id,
        createdAt: new Date(num * 10_000),
        fileSize,
        fileHash: id
      }
      await BlobStorage().insert(dbFile)
      return dbFile
    })
  )
