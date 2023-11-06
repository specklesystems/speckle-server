/* eslint-disable @typescript-eslint/require-await */

import { IRawBridge } from '~/lib/bridge/definitions'
import { GenericBridge } from '~/lib/bridge/generic-v2'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

/**
 * The name under which this binding will be registered.
 */
export const IConfigBindingKey = 'configBinding'

/**
 * A test binding interface to ensure compatbility. Ideally all host environments would implement and register it.
 */
export interface IConfigBinding extends IBinding<IConfigBindingEvents> {
  getConfig: () => Promise<Config>
  updateConfig: (config: Config) => Promise<void>
}

export interface IConfigBindingEvents {
  void: () => void
}

export type Config = {
  hostApp: string
  darkTheme: boolean
  onboardingCompleted: boolean
}

export type ConfigV2 = {
  global: GlobalConfig
  connectors: ConnectorConfigDictionary
}

export type ConnectorConfigDictionary = {
  [hostAppName: string]: ConnectorConfig
}

export type GlobalConfig = {
  onboardingCompleted: boolean
}

export type ConnectorConfig = {
  hostApp: string
  settings: ConnectorSettings
}

export type ConnectorSettings = {
  user: UserSettings
  model: ModelSettings
}

export type UserSettings = {}

export type ModelSettings = {}

export class MockedConfigBinding extends GenericBridge {
  constructor() {
    super(globalThis as unknown as IRawBridge)
  }

  getConfig() {
    return {
      darkTheme: false,
      onboardingCompleted: false
    }
  }

  getConfigV2() {
    return {
      global: {
        onboardingCompleted: false
      },
      connectors: {
        hostAppName: {
          hostApp: '',
          settings: {
            user: {
              darkTheme: false
            },
            model: {}
          }
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateConfig(config: Config) {
    // do nothing
  }
}
