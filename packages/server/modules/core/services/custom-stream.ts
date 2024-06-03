/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Writable, Readable, Transform, TransformCallback } from 'stream'
import zlib from 'zlib'
import StreamArray from 'stream-json/streamers/StreamArray'
import { parser as jsonLineParser } from 'stream-json/jsonl/Parser'

import Chain from 'stream-chain'
import crs from 'crypto-random-string'
import knex from '@/db/knex'
import { getMaximumObjectSizeMB } from '@/modules/shared/helpers/envHelper'
import { servicesLogger } from '@/logging/logging'
import { Knex } from 'knex'

const Objects = () => knex('objects')

type InsertionObjectWrapper = {
  insertionObject: {
    id: string
    data: string
    streamId: string
  }
  size: number
}

type InsertionObjectChunk = {
  data: InsertionObjectWrapper[]
  size: number
}

/**
 * Preps a raw object into a ready to insert db record.
 */
class InsertionObjectTransformer extends Transform {
  projectId: string
  processedIds: string[]
  constructor(projectId: string) {
    super({ objectMode: true })
    this.projectId = projectId
    this.processedIds = []
  }
  _transform(obj: any, _: BufferEncoding, callback: TransformCallback): void {
    // Fallback: in case we get an object without an id, generate a dummy one
    if (!obj.value.id) obj.value.id = 'server_' + crs({ length: 25 })

    // Protects against duplicate objects being sent.
    if (this.processedIds.includes(obj.value.id)) {
      return callback()
    }
    this.processedIds.push(obj.value.id)

    const data = JSON.stringify(obj.value)
    const size = data.length / 1_000_000
    if (size > getMaximumObjectSizeMB()) {
      return callback(
        new Error(
          `Individual object size too large. Max ${getMaximumObjectSizeMB()}mb, got ${size}mb.`
        )
      )
    }
    callback(null, {
      insertionObject: {
        data,
        id: obj.value.id,
        streamId: this.projectId
      },
      size
    } as InsertionObjectWrapper)
  }
}

/**
 * Batches insertion objects in chunks of maximum estimated size or maximum object count.
 * This is basically a "custom" backpressure mechanism for the db writer. It's needed as we can't control
 * the high water mark from both ends (size and object count) at the same time in a writable stream.
 *
 * This dude is needed as we want to keep in check memory pressure coming from large insert statements,
 * where knex does its things, etc.
 */
class DatabaseBatchSplitter extends Transform {
  maxSizeMb: number
  accumulator: InsertionObjectWrapper[]
  accumulatedSize: number
  maxObjectCount: number

  constructor(maxSizeMb: number = 2, maxObjectCount: number = 1000) {
    super({ objectMode: true })
    this.maxSizeMb = maxSizeMb
    this.maxObjectCount = maxObjectCount
    this.accumulator = []
    this.accumulatedSize = 0
  }

  _transform(
    obj: InsertionObjectWrapper,
    _: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (!obj) {
      callback()
    }

    this.accumulatedSize += obj.size
    this.accumulator.push(obj)
    if (
      this.accumulatedSize >= this.maxSizeMb ||
      this.accumulator.length > this.maxObjectCount
    ) {
      this.sortAccumulator()
      this.push({
        data: this.accumulator,
        size: this.accumulatedSize
      } as InsertionObjectChunk)
      this.accumulator = []
      this.accumulatedSize = 0
    }
    callback(null)
  }

  _flush(callback: TransformCallback): void {
    if (this.accumulator?.length !== 0) {
      this.sortAccumulator()
      this.push({
        data: this.accumulator,
        size: this.accumulatedSize
      } as InsertionObjectChunk)

      // @ts-expect-error
      this.accumulator = null
      this.accumulatedSize = 0
    }
    callback(null)
  }

  private sortAccumulator() {
    this.accumulator?.sort((a, b) =>
      a.insertionObject.id > b.insertionObject.id ? 1 : -1
    ) // Batches need to be inserted ordered by id to avoid deadlocks
  }
}

class TransactionPerInsertDatabaseWriter extends Writable {
  constructor() {
    super({ objectMode: true })
  }
  async _write(
    chunk: InsertionObjectChunk,
    _: unknown,
    callback: (error?: Error | null | undefined) => void
  ): Promise<void> {
    try {
      const payload = chunk.data.map((o) => o.insertionObject)
      await Objects().insert(payload).onConflict().ignore()
      servicesLogger.info(
        `Inserted ${chunk.data.length} objects, approx size ${chunk.size}mb`
      )
      callback()
    } catch (err: unknown) {
      callback(err as Error)
    }
  }
}

class SingleTransactionDatabaseWriter extends Writable {
  // @ts-expect-error
  trx: Knex.Transaction
  // @ts-expect-error
  t0: number
  totalCount: number
  constructor() {
    super({ objectMode: true }) // highwatermark = 16 InsertionObjectChunks
    this.totalCount = 0
  }

  async _construct(
    callback: (error?: Error | null | undefined) => void
  ): Promise<void> {
    this.trx = await knex.transaction()
    this.t0 = performance.now()
    return callback()
  }

  async _write(
    chunk: InsertionObjectChunk,
    _: unknown,
    callback: (error?: Error | null | undefined) => void
  ): Promise<void> {
    const payload = chunk.data.map((o) => o.insertionObject)
    const ids = payload.map((x) => x.id)
    const s = [...new Set(ids)]

    try {
      if (ids.length !== s.length) {
        servicesLogger.warn(
          'Non-unique objs in db insertion list. May cause a deadlock.'
        )
      }
      await this.trx('objects').insert(payload).onConflict().ignore()

      servicesLogger.info(
        `Dropped in the transaction ${chunk.data.length} objects, approx size ${chunk.size}mb`
      )
      this.totalCount += chunk.data.length
      callback()
    } catch (err: unknown) {
      callback(err as Error)
    }
  }

  // Note: not really needed
  // // @ts-expect-error
  // async _writev(
  //   chunks: { chunk: InsertionObjectChunk; _: BufferEncoding }[],
  //   callback: (error?: Error | null | undefined) => void
  // ): Promise<void> {
  //   try {
  //     const payload = chunks
  //       .map((c) => c.chunk.data.map((d) => d.insertionObject))
  //       .flat()
  //       .sort((a, b) => (a.id > b.id ? 1 : -1)) // This bigger batch needs to be resorted to avoid deadlocks
  //     const totalSize = chunks.reduce((total, { chunk: { size } }) => total + size, 0)

  //     await this.trx('objects').insert(payload).onConflict().ignore()

  //     servicesLogger.info(
  //       `(bulk write) Dropped in the transaction ${payload.length} objects, approx size ${totalSize}mb`
  //     )
  //     callback()
  //   } catch (err: unknown) {
  //     callback(err as Error)
  //   }
  // }

  async _final(callback: (error?: Error | null | undefined) => void): Promise<void> {
    try {
      await this.trx.commit()
      const duration = (performance.now() - this.t0) / 1000
      servicesLogger.info(
        `Commited the transaction with ${this.totalCount} objects in ${duration}s.`
      )

      callback()
    } catch (err: unknown) {
      await this.trx.rollback()
      const duration = (performance.now() - this.t0) / 1000

      servicesLogger.error(err)
      servicesLogger.error(`Rolled back the transaction in ${duration}s.`)

      callback(err as Error)
    }
  }
}

type Stream = Readable | Writable | Transform

export function getDbPipeline(
  projectId: string,
  useGunzip: boolean,
  useSingleTransactionDbWriter: boolean = true
) {
  const operations = [
    StreamArray.withParser(),
    new InsertionObjectTransformer(projectId),
    new DatabaseBatchSplitter(),
    useSingleTransactionDbWriter
      ? new SingleTransactionDatabaseWriter()
      : new TransactionPerInsertDatabaseWriter()
  ] as Stream[]

  if (useGunzip) {
    operations.unshift(zlib.createGunzip())
  }

  return new Chain(operations)
}

export function getTestPipeline(projectId: string) {
  return new Chain([
    zlib.createGunzip(),
    jsonLineParser(),
    new InsertionObjectTransformer(projectId),
    new DatabaseBatchSplitter(),
    new SingleTransactionDatabaseWriter()
  ])
}
