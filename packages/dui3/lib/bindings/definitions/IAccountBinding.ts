import type { IBinding, IBindingSharedEvents } from 'lib/bindings/definitions/IBinding'

export const IAccountBindingKey = 'accountsBinding'

export interface IAccountBinding extends IBinding<IAccountBindingEvents> {
  getAccounts: () => Promise<Account[]>
  removeAccount: (accountId: string) => Promise<void>
}

// An almost 1-1 mapping of what we need from the Core accounts class.
export type Account = {
  id: string
  isDefault: boolean
  token: string
  serverInfo: {
    name: string
    url: string
    frontend2: boolean
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

export interface IAccountBindingEvents extends IBindingSharedEvents {}
