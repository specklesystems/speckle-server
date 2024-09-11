import { BlobStorageItem } from '@/modules/blobstorage/domain/types'
import { MaybeNullOrUndefined } from '@speckle/shared'

export type GetBlobs = (params: {
  streamId?: MaybeNullOrUndefined<string>
  blobIds: string[]
}) => Promise<BlobStorageItem[]>
