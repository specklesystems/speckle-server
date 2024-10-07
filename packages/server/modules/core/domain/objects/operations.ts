import { SpeckleObject } from '@/modules/core/domain/objects/types'
import { Optional } from '@speckle/shared'

export type GetStreamObjects = (
  streamId: string,
  objectIds: string[]
) => Promise<SpeckleObject[]>

export type GetObject = (
  objectId: string,
  streamId: string
) => Promise<Optional<SpeckleObject>>
