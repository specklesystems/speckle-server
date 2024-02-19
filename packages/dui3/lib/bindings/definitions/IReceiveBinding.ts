import { ModelCardProgress } from '~/lib/models/card'
import { CardSetting } from 'lib/models/card/setting'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { BaseBridge } from '~~/lib/bridge/base'

export const IReceiveBindingKey = 'receiveBinding'

export interface IReceiveBinding extends IBinding<IReceiveBindingEvents> {
  receive: (
    modelId: string,
    versionId: string,
    projectName: string,
    modelName: string
  ) => Promise<void>
  getReceiveSettings: () => Promise<CardSetting[]>
  cancelReceive: (modelId: string) => Promise<void>
  invalidate: (modelId: string) => Promise<void> // What is this supposed to do
}

export interface IReceiveBindingEvents {
  setModelProgress: (args: {
    modelCardId: string
    progress?: ModelCardProgress
  }) => void
  setModelReceiveResult: (args: {
    modelCardId: string
    receiveResult: { bakedObjectIds: string[]; display: boolean }
  }) => void
  setModelError: (args: { modelCardId: string; error: string }) => void
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
