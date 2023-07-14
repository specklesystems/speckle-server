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
}

export interface IBaseBindingHostEvents {
  displayToastNotification: (args: ToastInfo) => void
  documentChanged: () => void
}

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
