import crs from 'crypto-random-string'
import { CardSetting } from 'lib/models/card/setting'
import {
  DiscriminatedObject,
  IDiscriminatedObject
} from '~~/lib/bindings/definitions/common'

export interface IModelCard extends IDiscriminatedObject {
  modelCardId: string
  modelId: string
  projectId: string
  accountId: string
  expired: boolean
  progress?: ModelCardProgress
  settings?: CardSetting[]
  error?: string
}

export class ModelCard extends DiscriminatedObject implements IModelCard {
  modelCardId: string
  modelId!: string
  projectId!: string
  accountId!: string
  expired: boolean
  progress: ModelCardProgress | undefined
  settings: CardSetting[] | undefined

  constructor(typeDiscriminator: string) {
    super(typeDiscriminator)
    this.modelCardId = crs({ length: 20 })
    this.expired = false
  }
}

export interface IModelCardSharedEvents {
  setModelError: (args: { modelCardId: string; error: string }) => void
  setModelProgress: (args: {
    modelCardId: string
    progress?: ModelCardProgress
  }) => void
}

export type ModelCardProgress = {
  status: string
  progress?: number
}
