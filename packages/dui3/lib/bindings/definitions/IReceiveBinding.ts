import { ModelCardNotification } from 'lib/models/card/notification'
import { ModelCardProgress } from 'lib/models/card/progress'
import { CardSetting } from 'lib/models/card/setting'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { BaseBridge } from '~~/lib/bridge/base'

export const IReceiveBindingKey = 'receiveBinding'

export interface IReceiveBinding extends IBinding<IReceiveBindingEvents> {
  receive: (modelId: string, versionId: string) => Promise<void>
  getReceiveSettings: () => Promise<CardSetting[]>
  cancelReceive: (modelId: string) => Promise<void>
  invalidate: (modelId: string) => Promise<void>
}

export interface IReceiveBindingEvents {
  receiverProgress: (args: ModelCardProgress) => void
  notify: (args: ModelCardNotification) => void
}

export class MockedReceiveBinding extends BaseBridge {
  constructor() {
    super()
  }

  getReceiveSettings() {
    return [
      {
        id: 'includeAttributes',
        type: 'boolean',
        title: 'Include Attributes',
        value: true,
        typeDiscriminator: 'CardSetting'
      },
      {
        id: 'mergeCoplanarFaces',
        type: 'boolean',
        title: 'Merge Coplanar Faces',
        value: true,
        typeDiscriminator: 'CardSetting'
      },
      {
        id: 'receiveMode',
        type: 'string',
        title: 'Receive Mode',
        default: 'Update',
        enum: ['Update', 'Create', 'Ignore'],
        typeDiscriminator: 'CardSetting'
      }
    ]
  }
}
