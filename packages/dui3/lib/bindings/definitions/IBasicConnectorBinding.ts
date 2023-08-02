/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~~/lib/bridge/base'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const IBasicConnectorBindingKey = 'baseBinding'

// Needs to be agreed between Frontend and Core
export interface IBasicConnectorBinding
  extends IBinding<IBasicConnectorBindingHostEvents> {
  // ACCOUNTS
  getAccounts: () => Promise<Account[]>

  // VARIOUS
  getSourceApplicationName: () => Promise<string>
  getSourceApplicationVersion: () => Promise<string>
  getDocumentInfo: () => Promise<DocumentInfo>

  // DOC STATE
  getDocumentState: () => Promise<DocumentState>
  saveDocumentState: (state: DocumentState) => Promise<void>
  addModelToDocumentState: (model: IModelCard) => Promise<void>
  removeModelFromDocumentState: (model: IModelCard) => Promise<void>

  // FILTERS AND TYPES
  getSendFilters: () => Promise<ISendFilter[]>
}

export interface IBasicConnectorBindingHostEvents {
  displayToastNotification: (args: ToastInfo) => void
  documentChanged: () => void
  filtersNeedRefresh: () => void
}

interface IDiscriminatedObject {
  typeDiscriminator: string
}

export type DocumentState = {
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

//
// Filters
//
export interface ISendFilter extends IDiscriminatedObject {
  name: string
  summary: string
}

export interface IDirectSelectionSendFilter extends ISendFilter {
  selectedObjectIds: string[]
}

export interface IListSendFilter extends ISendFilter {
  options: string[]
  selectedOptions: string[]
  singleSelection: boolean
}

// An almost 1-1 mapping of what we need from the Core accounts class.
export type Account = {
  id: string
  isDefault: boolean
  token: string
  serverInfo: {
    name: string
    url: string
  }
  userInfo: {
    id: string
    avatar: string
    email: string
    name: string
    commits: { totalCount: number }
    streams: { totalCount: number }
  }
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

  public async getAccounts() {
    return []
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
