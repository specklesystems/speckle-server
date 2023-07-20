import { BaseError } from '@/modules/shared/errors'
import { Options } from 'verror'

type InsertionObject = {
  data: string
}

export class ArgumentError extends BaseError {
  static defaultMessage = 'Invalid argument value provided'

  constructor(message?: string | undefined, options?: Options | Error | undefined) {
    super(message, options)
  }
}

// Js uses utf16 so string size in byes is length * 2
export const calculateStringByteSize = (str: string) => new Blob([str]).size
export const calculateStringMegabyteSize = (str: string) =>
  calculateStringByteSize(str) / 1_000_000

export const chunkInsertionObjectArray = ({
  objects,
  chunkSizeLimitMb,
  chunkLengthLimit
}: {
  chunkSizeLimitMb: number
  chunkLengthLimit: number
  objects: InsertionObject[]
}): InsertionObject[][] => {
  if (chunkLengthLimit < 1)
    throw new ArgumentError('Chunks must have a length limit > 1')
  if (chunkSizeLimitMb <= 0)
    throw new ArgumentError('Chunks must have a size in MB limit > 0')

  let currentChunkSize = 0
  let currentChunkLength = 0
  const chunkedObjects: InsertionObject[][] = []
  let currentBatch: InsertionObject[] = []
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
    currentChunkSize += calculateStringMegabyteSize(obj.data)
    currentBatch.push(obj)
  }
  // do not forget to push the final batch
  chunkedObjects.push(currentBatch)
  return chunkedObjects
}
