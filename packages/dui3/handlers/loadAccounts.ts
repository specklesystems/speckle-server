import { Account } from '../types/account'

export const loadAccounts = (accounts: Account[]) => {
  if (accounts.length !== 0) {
    localStorage.setItem('localAccounts', JSON.stringify(accounts))
    const uuid = localStorage.getItem('uuid')
    let account: Account | undefined
    if (uuid) {
      account = accounts.find((acct: Account) => acct.userInfo.id === uuid)
    } else {
      account = accounts.find((acct: Account) => acct.isDefault)
    }
    if (account !== undefined) {
      localStorage.setItem('selectedAccount', JSON.stringify(account))
      localStorage.setItem('serverUrl', account.serverInfo.url)
      localStorage.setItem('SpeckleSketchup.AuthToken', account.token)
      localStorage.setItem('uuid', account.userInfo.id)
    }
  }
}

window.loadAccounts = loadAccounts
