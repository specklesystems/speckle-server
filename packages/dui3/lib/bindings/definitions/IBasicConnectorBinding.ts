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
  addModelToDocumentState: (model: ModelCard) => Promise<void>
  removeModelFromDocumentState: (model: ModelCard) => Promise<void>
}

export interface IBasicConnectorBindingHostEvents {
  displayToastNotification: (args: ToastInfo) => void
  documentChanged: () => void
}

export type DocumentState = {
  models: ModelCard[]
}

export type ModelCard = {
  id: string
  modelId: string
  projectId: string
  accountId: string
}

export type SenderCard = ModelCard & {
  type: 'sender'
  sendFilter: ISendFilter
}

export interface ISendFilter {
  name: string
  summary: string
}

export interface ISelectionFilter extends ISendFilter {
  objectIds: string[]
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
