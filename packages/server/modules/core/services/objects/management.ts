import crypto from 'crypto'
import {
  InsertableSpeckleObject,
  RawSpeckleObject
} from '@/modules/core/domain/objects/types'
import { getMaximumObjectSizeMB } from '@/modules/shared/helpers/envHelper'
import {
  chunkInsertionObjectArray,
  estimateStringMegabyteSize
} from '@/modules/core/utils/chunking'
import { ObjectHandlingError } from '@/modules/core/errors/object'
import { servicesLogger } from '@/logging/logging'
import {
  CreateObject,
  CreateObjects,
  CreateObjectsBatchedAndNoClosures,
  StoreObjectsIfNotFound,
  StoreSingleObjectIfNotFound
} from '@/modules/core/domain/objects/operations'

/**
 * Note: we're generating the hash here, rather than on the db side, as there are
 * limitations when doing upserts - ignored fields are not always returned, hence
 * we cannot provide a full response back including all object hashes.
 */
const prepInsertionObject = (
  streamId: string,
  obj: RawSpeckleObject
): InsertableSpeckleObject => {
  const MAX_OBJECT_SIZE_MB = getMaximumObjectSizeMB()

  if (obj.hash) obj.id = obj.hash
  else
    obj.id =
      obj.id || crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex') // generate a hash if none is present

  const stringifiedObj = JSON.stringify(obj)
  const objectByteSize = estimateStringMegabyteSize(stringifiedObj)
  if (objectByteSize > MAX_OBJECT_SIZE_MB) {
    throw new ObjectHandlingError(
      `Object too large. Object ID: ${obj.id}. (${objectByteSize} MB is > than limit, ${MAX_OBJECT_SIZE_MB} MB)`
    )
  }

  return {
    data: stringifiedObj,
    streamId,
    id: obj.id,
    // YEAH, this has been broken forever...
    // speckleType: obj.speckleType
    speckleType: obj.speckle_type
  }
}

export const createObjectFactory =
  (deps: {
    storeSingleObjectIfNotFoundFactory: StoreSingleObjectIfNotFound
  }): CreateObject =>
  async ({ streamId, object, logger = servicesLogger }) => {
    const insertionObject = prepInsertionObject(streamId, object)

    const totalChildrenCountByDepth: Record<string, number> = {}

    let totalChildrenCount = 0
    if (object.__closure !== null) {
      for (const prop in object.__closure) {
        totalChildrenCount++
        if (totalChildrenCountByDepth[object.__closure[prop].toString()])
          totalChildrenCountByDepth[object.__closure[prop].toString()]++
        else totalChildrenCountByDepth[object.__closure[prop].toString()] = 1
      }
    }

    const finalInsertionObject: InsertableSpeckleObject = {
      ...insertionObject,
      totalChildrenCount,
      totalChildrenCountByDepth: JSON.stringify(totalChildrenCountByDepth)
    }

    await deps.storeSingleObjectIfNotFoundFactory(finalInsertionObject)

    logger.debug({ objectId: insertionObject.id }, 'Inserted object: {objectId}')

    return insertionObject.id
  }

//  Batches need to be inserted ordered by id to avoid deadlocks
const prepInsertionObjectBatch = (batch: InsertableSpeckleObject[]) => {
  batch.sort((a, b) => (a.id > b.id ? 1 : -1))
}

export const createObjectsBatchedAndNoClosuresFactory =
  (deps: {
    storeObjectsIfNotFoundFactory: StoreObjectsIfNotFound
  }): CreateObjectsBatchedAndNoClosures =>
  async ({ streamId, objects, logger = servicesLogger }) => {
    const objsToInsert: InsertableSpeckleObject[] = []
    const ids: string[] = []

    // Prep objects up
    objects.forEach((obj) => {
      const insertionObject = prepInsertionObject(streamId, obj)
      objsToInsert.push(insertionObject)
      ids.push(insertionObject.id)
    })

    const objectsBatchSize = 500

    // step 1: insert objects
    if (objsToInsert.length > 0) {
      const batches = chunkInsertionObjectArray({
        objects: objsToInsert,
        chunkLengthLimit: objectsBatchSize,
        chunkSizeLimitMb: 2
      })
      for (const batch of batches) {
        prepInsertionObjectBatch(batch)
        await deps.storeObjectsIfNotFoundFactory(batch)
        logger.info({ batchLength: batch.length }, 'Inserted {batchLength} objects.')
      }
    }

    return ids
  }

export const createObjectsFactory =
  (deps: { storeObjectsIfNotFoundFactory: StoreObjectsIfNotFound }): CreateObjects =>
  async ({ streamId, objects, logger = servicesLogger }) => {
    // TODO: Switch to knex batch inserting functionality
    // see http://knexjs.org/#Utility-BatchInsert
    const batches: RawSpeckleObject[][] = []
    const maxBatchSize =
      (process.env.MAX_BATCH_SIZE ? parseInt(process.env.MAX_BATCH_SIZE) : 0) || 250

    objects = [...objects]
    if (objects.length > maxBatchSize) {
      while (objects.length > 0) batches.push(objects.splice(0, maxBatchSize))
    } else {
      batches.push(objects)
    }

    const ids: string[] = []

    const insertBatch = async (batch: RawSpeckleObject[], index: number) => {
      const objsToInsert: InsertableSpeckleObject[] = []

      const t0 = performance.now()

      batch.forEach((obj) => {
        if (!obj) return

        const insertionObject = prepInsertionObject(streamId, obj)
        const totalChildrenCountByDepth: Record<string, number> = {}
        let totalChildrenCountGlobal = 0
        if (obj.__closure !== null) {
          for (const prop in obj.__closure) {
            totalChildrenCountGlobal++

            if (totalChildrenCountByDepth[obj.__closure[prop].toString()])
              totalChildrenCountByDepth[obj.__closure[prop].toString()]++
            else totalChildrenCountByDepth[obj.__closure[prop].toString()] = 1
          }
        }

        insertionObject.totalChildrenCount = totalChildrenCountGlobal
        insertionObject.totalChildrenCountByDepth = JSON.stringify(
          totalChildrenCountByDepth
        )

        objsToInsert.push(insertionObject)
        ids.push(insertionObject.id)
      })

      if (objsToInsert.length > 0) {
        await deps.storeObjectsIfNotFoundFactory(objsToInsert)
      }

      const t1 = performance.now()

      logger.info(
        {
          batchIndex: index + 1,
          totalCountOfBatches: batches.length,
          elapsedTimeMs: t1 - t0
        },
        'Batch {batchIndex}/{totalCountOfBatches}: Stored {countStoredObjects} objects in {elapsedTimeMs}ms.'
      )
    }

    const promises = batches.map((batch, index) => insertBatch(batch, index))

    await Promise.all(promises)

    return ids
  }
