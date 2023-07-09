import { createNanoEvents, Emitter } from 'nanoevents'
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
  status: 'idle' | 'inprogress' | 'error' | 'warning' | 'disabled'
}

type TestData = {
  foo: number
  bar: string
  baz: boolean
}

export interface HostAppEvents {
  test: (data: TestData) => void
  documentChanged: () => void
  selectionChanged: () => void
  documentClosed: () => void
  updateModelCardState: () => void
  displayToastNotification: () => void // bla bla bla
}

export interface IWebUiBinding {
  sayHi: (name: string) => Promise<string>
  openDevTools: () => Promise<void>
  getAccounts: () => Promise<Account[]>
  getSourceAppName: () => Promise<string>
  // getFileState: () => Promise<FileState>
  // addModelCard(string modelId, string projectId), removeModelCard(...) // etc. etc.
  /**
   * Subscribe to messages from the host application.
   * @param event
   * @param callback
   */
  on: <E extends keyof HostAppEvents>(event: E, callback: HostAppEvents[E]) => void
  /**
   * Used by the host application to notify/send data to the web app. Do not use from the frontend.
   * @param eventName
   * @param args
   */
  emit?: (eventName: string, args: Record<string, unknown>) => void
}

const mockedEmitter = createNanoEvents<HostAppEvents>()
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
  },
  on<E extends keyof HostAppEvents>(event: E, callback: HostAppEvents[E]) {
    return mockedEmitter.on(event, callback)
  }
}
