import { SpeckleObject } from '@/modules/core/domain/objects/types'

export type GetStreamObjects = (
  streamId: string,
  objectIds: string[]
) => Promise<SpeckleObject[]>
