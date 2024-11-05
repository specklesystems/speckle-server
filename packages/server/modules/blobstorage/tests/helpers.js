/* istanbul ignore file */
const crs = require('crypto-random-string')
const { range } = require('lodash')
const { knex } = require('@/db/knex')
const BlobStorage = () => knex('blob_storage')

const fakeIdGenerator = () => crs({ length: 10 })
const createBlobs = async ({ streamId, number, fileSize = 1 }) =>
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

module.exports = {
  fakeIdGenerator,
  createBlobs
}
