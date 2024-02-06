import crs from 'crypto-random-string'
import { CardSetting } from 'lib/models/card/setting'
import {
  DiscriminatedObject,
  IDiscriminatedObject
} from '~~/lib/bindings/definitions/common'
import { ModelCardNotification } from '~~/lib/models/card/notification'
import { ModelCardProgress } from '~~/lib/models/card/progress'
export type ModelCardTypeDiscriminators = 'SenderModelCard' | 'ReceiverModelCard'

export interface IModelCard extends IDiscriminatedObject {
  id: string
  modelId: string
  projectId: string
  accountId: string
  notifications?: ModelCardNotification[]
  progress?: ModelCardProgress
  settings?: CardSetting[]
}

export class ModelCard extends DiscriminatedObject implements IModelCard {
  id: string
  modelId!: string
  projectId!: string
  accountId!: string
  notifications: ModelCardNotification[]
  progress: ModelCardProgress | undefined
  settings: CardSetting[] | undefined

  constructor(typeDiscriminator: string) {
    super(typeDiscriminator)
    this.id = crs({ length: 20 })
    this.notifications = []
  }
}
