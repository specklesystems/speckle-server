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

export interface ICefSharp {
  BindObjectAsync: (arg: string) => Promise<void>
}

export interface IWebViev {
  webview: {
    hostObjects: {
      WebUIBinding: WebUiBindingType
    }
  }
}

export type WebUiBindingType = {
  getAccounts: () => Promise<string>
  sayHi: (name: string) => Promise<string>
  getSourceAppName: () => Promise<string>
  openDevTools: () => Promise<void>
}

export const MockedBindings: WebUiBindingType = {
  async getAccounts() {
    return '[]'
  },
  async sayHi(name: string) {
    return `Hi ${name} from (mocked bindings)!`
  },
  async getSourceAppName() {
    return 'Mocked App'
  },
  async openDevTools() {
    console.log('Open it yourself. I am just a set of mocked bindings!!!')
  }
}
