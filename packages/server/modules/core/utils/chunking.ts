import { InsertableSpeckleObject } from '@/modules/core/domain/objects/types'
import { BaseError } from '@/modules/shared/errors'
import { Options } from 'verror'

type InsertionObject = Pick<InsertableSpeckleObject, 'data'>

export class ArgumentError extends BaseError {
  static defaultMessage = 'Invalid argument value provided'

  constructor(message?: string | undefined, options?: Options | Error | undefined) {
    super(message, options)
  }
  static statusCode = 400
}

// since we're mostly using this for an artificial limit calculation
// we can live with a somewhat imprecise but fast estimate
// Js uses utf16 so the in memory string size in bytes is length * 2
// this is just the in memory string size, not the utf-8 encoded byte size
// since our data is mostly ascii characters, its prob safe to use
// string.length is a slight underestimation of the actual size
export const estimateStringByteSize = (str: string) => str.length
export const estimateStringMegabyteSize = (str: string) =>
  estimateStringByteSize(str) / 1_000_000

export const chunkInsertionObjectArray = <O extends InsertionObject = InsertionObject>({
  objects,
  chunkSizeLimitMb,
  chunkLengthLimit
}: {
  chunkSizeLimitMb: number
  chunkLengthLimit: number
  objects: O[]
}): O[][] => {
  if (chunkLengthLimit < 1)
    throw new ArgumentError('Chunks must have a length limit > 1')
  if (chunkSizeLimitMb <= 0)
    throw new ArgumentError('Chunks must have a size in MB limit > 0')

  let currentChunkSize = 0
  let currentChunkLength = 0
  const chunkedObjects: O[][] = []
  let currentBatch: O[] = []
  for (const obj of objects) {
    // if limits are exceeded start a new batch
    if (
      currentChunkSize >= chunkSizeLimitMb ||
      currentChunkLength >= chunkLengthLimit
    ) {
      // push the current batch into the final chunks
      chunkedObjects.push(currentBatch)
      // reset the current batch
      currentBatch = []
      // reset limits
      currentChunkSize = 0
      currentChunkLength = 0
    }
    // do some proper chunking here
    // insert the batch to returned chunks
    currentChunkLength++
    currentChunkSize += estimateStringMegabyteSize(obj.data)
    currentBatch.push(obj)
  }
  // do not forget to push the final batch
  chunkedObjects.push(currentBatch)
  return chunkedObjects
}
