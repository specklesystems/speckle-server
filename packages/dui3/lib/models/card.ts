import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { ModelCardNotification } from '~~/lib/models/card/notification'
import { ModelCardProgress } from '~~/lib/models/card/progress'

export type ModelCardTypeDiscriminators = 'SenderModelCard' | 'ReceiverModelCard'

export interface IModelCard extends IDiscriminatedObject {
  id: string
  modelId: string
  projectId: string
  accountId: string
  expired?: boolean
  lastLocalUpdate?: string
  notifications?: ModelCardNotification[]
  progress?: ModelCardProgress
}
