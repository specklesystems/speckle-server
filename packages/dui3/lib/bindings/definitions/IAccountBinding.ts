import { BaseBridge } from '~~/lib/bridge/base'

export const IAccountBindingKey = 'accountsBinding'

export interface IAccountBinding {
  getAccounts: () => Promise<Account[]>
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

export class MockedAccountBinding extends BaseBridge {
  constructor() {
    super()
  }

  getAccounts() {
    const config = useRuntimeConfig()
    return [
      {
        id: config.public.speckleAccountId,
        isDefault: true,
        token: config.public.speckleToken,
        serverInfo: {
          name: 'DUI3 Test',
          url: config.public.speckleUrl
        },
        userInfo: {
          id: config.public.speckleUserId,
          avatar: '',
          email: 'dui3_test@speckle.systems',
          name: 'DUI3 Test',
          commits: { totalCount: 10 },
          streams: { totalCound: 10 }
        }
      }
    ]
  }
}
