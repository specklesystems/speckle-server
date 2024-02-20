import { IModelCardSharedEvents } from 'lib/models/card'
import { CardSetting } from 'lib/models/card/setting'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { BaseBridge } from '~~/lib/bridge/base'

export const IReceiveBindingKey = 'receiveBinding'

export interface IReceiveBinding extends IBinding<IReceiveBindingEvents> {
  receive: (modelCardId: string) => Promise<void>
  getReceiveSettings: () => Promise<CardSetting[]>
  cancelReceive: (modelId: string) => Promise<void>
}

export interface IReceiveBindingEvents extends IModelCardSharedEvents {
  // See note oon timeout in bridge v2; we might not need this
  setModelReceiveResult: (args: {
    modelCardId: string
    receiveResult: { bakedObjectIds: string[]; display: boolean }
  }) => void
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
        value: 'Update',
        enum: ['Update', 'Create', 'Ignore'],
        typeDiscriminator: 'CardSetting'
      }
    ]
  }
}
