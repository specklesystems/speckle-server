export interface IBaseBindings {
  sayHi: (name: string) => Promise<string>
  getAccounts: () => Promise<Account[]>
  getSourceAppName: () => Promise<string>
  getSourceAppVersion: () => Promise<string>
  getDocumentInfo: () => Promise<DocumentInfo>

  // TODO:
  getFileState: () => Promise<FileState>
  updateFileState: (state: FileState) => Promise<void>

  /**
   * Subscribe to messages from the host application.
   * @param event
   * @param callback
   */
  on: <E extends keyof IBaseBindingsHostEvents>(
    event: E,
    callback: IBaseBindingsHostEvents[E]
  ) => void
}

export interface IBaseBindingsHostEvents {
  displayToastNotification: (args: ToastInfo) => void
  documentChanged: () => void
  selectionChanged: (args: SelectionChangedInfo) => void
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

export type FileState = {
  models: ModelCard[]
}

export type ModelCard = {
  serverUrl: string // we need to select the correct account
  modelId: string // we need to assemble the gql query properly
  projectId: string
  type: 'sender' | 'receiver'
  status?: 'idle' | 'inprogress' | 'error' | 'warning' | 'disabled' | 'expired' //???
  // settings: Record<string,unknown>???
  // report: Record<string,unknown>???
  // progress: Record<string, unknown> // ??? send status, receive status
}
export type DocumentInfo = {
  location: string
  name: string
  id: string
}

export type ToastInfo = {
  text: string
  details?: string
  type: 'info' | 'error' | 'warning'
}

export type SelectionChangedInfo = {
  objectIds: string[]
  humanReadableSummary?: string
}
