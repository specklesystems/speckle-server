/* eslint-disable @typescript-eslint/require-await */
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

type FileState = {
  models: ModelCard[]
}

type ModelCard = {
  serverUrl: string
  modelId: string
  projectId: string
  type: 'sender' | 'receiver'
  lastUpdatedAt: Date
  // settings: Record<string,unknown>???
  // report: Record<string,unknown>???
  // progress: Record<string,unknown>???
}

export type IWebUiBinding = {
  sayHi: (name: string) => Promise<string>
  openDevTools: () => Promise<void>
  getAccounts: () => Promise<Account[]>
  getSourceAppName: () => Promise<string>
  // etc.
  getFileState: () => Promise<FileState>
}

export const MockedBindings: IWebUiBinding = {
  async sayHi(name: string) {
    return `Hi ${name} from (mocked bindings)!`
  },
  async openDevTools() {
    // eslint-disable-next-line no-alert
    window.alert('Mocked bindings cannot do this. Sorry :(')
  },
  async getAccounts() {
    return []
  },
  async getSourceAppName() {
    return 'Mocked App'
  },
  async getFileState() {
    return { models: [] }
  }
}
