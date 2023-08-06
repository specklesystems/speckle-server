/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~~/lib/bridge/base'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { ISendFilter } from '~~/lib/bindings/definitions/ISendBinding'

export const IBasicConnectorBindingKey = 'baseBinding'

// Needs to be agreed between Frontend and Core
export interface IBasicConnectorBinding
  extends IBinding<IBasicConnectorBindingHostEvents> {
  // Various
  getSourceApplicationName: () => Promise<string>
  getSourceApplicationVersion: () => Promise<string>
  getDocumentInfo: () => Promise<DocumentInfo>

  // Document state calls
  getDocumentState: () => Promise<DocumentModelStore>
  saveDocumentModelStore: (state: DocumentModelStore) => Promise<void>
  addModel: (model: IModelCard) => Promise<void>
  updateModel: (model: IModelCard) => Promise<void>
  removeModel: (model: IModelCard) => Promise<void>

  // FILTERS AND TYPES
  getSendFilters: () => Promise<ISendFilter[]>
}

export interface IBasicConnectorBindingHostEvents {
  documentChanged: () => void
  filtersNeedRefresh: () => void
}

export type DocumentModelStore = {
  models: IModelCard[]
}

//
// Model cards
//
export interface IModelCard extends IDiscriminatedObject {
  id: string
  modelId: string
  projectId: string
  accountId: string
  lastLocalUpdate?: string
}

export type ModelCardTypeDiscriminators = 'SenderModelCard' | 'ReceiverModelCard'

export interface ISenderModelCard extends IModelCard {
  typeDiscriminator: 'SenderModelCard'
  sendFilter: ISendFilter
}

export interface IReceiverModelCard extends IModelCard {
  typeDiscriminator: 'ReceiverModelCard'
  todo: string
}

export type DocumentInfo = {
  location: string
  name: string
  id: string
}

// NOTE: just a reminder for now
export type ToastInfo = {
  text: string
  details?: string
  type: 'info' | 'error' | 'warning'
}

export class MockedBaseBinding extends BaseBridge {
  constructor() {
    super()
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

  public async showDevTools() {
    console.log('Mocked bindings cannot do this')
  }
}
