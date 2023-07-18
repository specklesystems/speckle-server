/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~~/lib/bridge/base'

// Needs to be agreed between Frontend and Core
export interface IBaseBinding {
  getAccounts: () => Promise<Account[]>
  getSourceApplicationName: () => Promise<string>
  getSourceApplicationVersion: () => Promise<string>
  getDocumentInfo: () => Promise<DocumentInfo>

  /**
   * Subscribe to messages from the host application.
   * @param event
   * @param callback
   */
  on: <E extends keyof IBaseBindingHostEvents>(
    event: E,
    callback: IBaseBindingHostEvents[E]
  ) => void
  /**
   * Note: this method does not need to be implemented in the .NET host application base bindings,
   * it is served by the DUI3 bridge.
   */
  showDevTools: () => Promise<void>
}

export interface IBaseBindingHostEvents {
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
    return '1'
  }

  public async getDocumentInfo() {
    return {
      name: 'Mocked File',
      location: 'www',
      id: '42'
    }
  }

  public async showDevTools() {
    console.log('Mocked bindings cannot do this')
  }
}
