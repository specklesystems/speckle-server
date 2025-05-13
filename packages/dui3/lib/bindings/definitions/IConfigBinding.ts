import { BaseBridge } from '~/lib/bridge/base'
import type {
  IBinding,
  IBindingSharedEvents
} from '~/lib/bindings/definitions/IBinding'

/**
 * The name under which this binding will be registered.
 */
export const IConfigBindingKey = 'configBinding'

/**
 * A test binding interface to ensure compatbility. Ideally all host environments would implement and register it.
 */
export interface IConfigBinding extends IBinding<IConfigBindingEvents> {
  getIsDevMode: () => Promise<boolean>
  getConfig: () => Promise<ConnectorConfig>
  updateConfig: (config: ConnectorConfig) => void
  setUserSelectedAccountId: (accountId: string) => void
  getUserSelectedAccountId: () => Promise<AccountsConfig>
  getAccountsConfig: () => Promise<AccountsConfig> // should have been named like this from day 0. we should get rid of `getUserSelectedAccountId` function after some amount of time to not confuse ourselves.
  setUserSelectedWorkspaceId: (workspaceId: string) => void
  getWorkspacesConfig: () => Promise<WorkspacesConfig>
}

export interface IConfigBindingEvents extends IBindingSharedEvents {}

export type ConnectorConfig = {
  darkTheme: boolean
}

export type AccountsConfig = {
  userSelectedAccountId: string
}

export type WorkspacesConfig = {
  userSelectedWorkspaceId: string
}

// Useless, but will do for now :)
export class MockedConfigBinding extends BaseBridge {}
