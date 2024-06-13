/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~~/lib/bridge/base'
import type { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const IBasicConnectorBindingKey = 'baseBinding'

// Needs to be agreed between Frontend and Core
export interface IBasicConnectorBinding
  extends IBinding<IBasicConnectorBindingHostEvents> {
  getAccounts: () => Promise<Account[]>
  getSourceApplicationName: () => Promise<string>
  getSourceApplicationVersion: () => Promise<string>
  getDocumentInfo: () => Promise<DocumentInfo>
}

export interface IBasicConnectorBindingHostEvents {
  displayToastNotification: (args: ToastInfo) => void
  documentChanged: () => void
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
