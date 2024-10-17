import crypto from 'crypto'
import {
  InsertableSpeckleObject,
  RawSpeckleObject
} from '@/modules/core/domain/objects/types'
import { getMaximumObjectSizeMB } from '@/modules/shared/helpers/envHelper'
import { estimateStringMegabyteSize } from '@/modules/core/utils/chunking'
import { ObjectHandlingError } from '@/modules/core/errors/object'
import { servicesLogger } from '@/logging/logging'
import {
  CreateObject,
  StoreClosuresIfNotFound,
  StoreSingleObjectIfNotFound
} from '@/modules/core/domain/objects/operations'

/**
 * Note: we're generating the hash here, rather than on the db side, as there are
 * limitations when doing upserts - ignored fields are not always returned, hence
 * we cannot provide a full response back including all object hashes.
 */
export const prepInsertionObject = (
  streamId: string,
  obj: RawSpeckleObject
): Omit<
  InsertableSpeckleObject,
  'totalChildrenCount' | 'totalChildrenCountByDepth' | 'createdAt'
> => {
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
    storeClosuresIfNotFound: StoreClosuresIfNotFound
  }): CreateObject =>
  async ({ streamId, object, logger = servicesLogger }) => {
    const insertionObject = prepInsertionObject(streamId, object)

    const closures: Array<{
      streamId: string
      parent: string
      child: string
      minDepth: number
    }> = []
    const totalChildrenCountByDepth: Record<string, number> = {}

    if (object.__closure !== null) {
      for (const prop in object.__closure) {
        closures.push({
          streamId,
          parent: insertionObject.id,
          child: prop,
          minDepth: object.__closure[prop]
        })

        if (totalChildrenCountByDepth[object.__closure[prop].toString()])
          totalChildrenCountByDepth[object.__closure[prop].toString()]++
        else totalChildrenCountByDepth[object.__closure[prop].toString()] = 1
      }
    }

    const finalInsertionObject: InsertableSpeckleObject = {
      ...insertionObject,
      totalChildrenCount: closures.length,
      totalChildrenCountByDepth: JSON.stringify(totalChildrenCountByDepth)
    }

    await deps.storeSingleObjectIfNotFoundFactory(finalInsertionObject)

    if (closures.length > 0) {
      const batchSize = 10000
      while (closures.length > 0) {
        const closuresBatch = closures.splice(0, batchSize) // splice so that we don't take up more memory
        await deps.storeClosuresIfNotFound(closuresBatch)
      }
    }

    logger.debug({ objectId: insertionObject.id }, 'Inserted object: {objectId}')

    return insertionObject.id
  }
