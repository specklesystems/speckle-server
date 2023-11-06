/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~~/lib/bridge/base'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { IModelCard } from '~~/lib/models/card'
import { ISendFilter } from '~~/lib/models/card/send'

export const IBasicConnectorBindingKey = 'baseBinding'

// Needs to be agreed between Frontend and Core
export interface IBasicConnectorBinding
  extends IBinding<IBasicConnectorBindingHostEvents> {
  // Various
  getSourceApplicationName: () => Promise<string>
  getSourceApplicationVersion: () => Promise<string>
  getConnectorVersion: () => Promise<string>
  getDocumentInfo: () => Promise<DocumentInfo>

  // Document state calls
  getDocumentState: () => Promise<DocumentModelStore>
  addModel: (model: IModelCard) => Promise<void>
  updateModel: (model: IModelCard) => Promise<void>
  highlightModel: (modelCardId: string) => Promise<void>
  removeModel: (model: IModelCard) => Promise<void>

  // FILTERS AND TYPES
  getSendFilters: () => Promise<ISendFilter[]>
}

export interface IBasicConnectorBindingHostEvents {
  documentChanged: () => void
}

export type DocumentModelStore = {
  models: IModelCard[]
}

export type DocumentInfo = {
  location: string
  name: string
  id: string
}

export type ToastInfo = {
  modelCardId: string
  text: string
  level: 'info' | 'danger' | 'warning' | 'success'
  action?: ToastAction
  timeout?: number
}

export type ToastAction = {
  url: string
  name: string
}

export class MockedBaseBinding extends BaseBridge {
  constructor() {
    super()
  }

  public async getConnectorVersion() {
    return '0.0.0'
  }

  public async getSourceApplicationName() {
    return 'Mocks'
  }

  public async getSourceApplicationVersion() {
    return Math.random().toString()
  }

  public async getDocumentInfo() {
    return {
      name: 'Mocked File',
      location: 'www',
      id: Math.random().toString()
    }
  }

  public async getDocumentState() {
    return {
      models: [
        // {
        //   typeDiscriminator: 'sender',
        //   id: 'sender_test',
        //   modelId: 'test',
        //   projectId: 'string',
        //   accountId: 'string',
        //   expired: false,
        //   lastLocalUpdate: '',
        //   notifications: []
        // },
        // {
        //   typeDiscriminator: 'receiver',
        //   id: 'receiver_test',
        //   modelId: 'test',
        //   projectId: 'string',
        //   accountId: 'string',
        //   expired: false,
        //   lastLocalUpdate: '',
        //   notifications: []
        // }
      ]
    }
  }

  public async showDevTools() {
    console.log('Mocked bindings cannot do this')
  }
}
