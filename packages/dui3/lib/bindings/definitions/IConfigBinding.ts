/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~/lib/bridge/base'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

/**
 * The name under which this binding will be registered.
 */
export const IConfigBindingKey = 'configBinding'

/**
 * A test binding interface to ensure compatbility. Ideally all host environments would implement and register it.
 */
export interface IConfigBinding extends IBinding<IConfigBindingEvents> {
  getConfig: () => Promise<UiConfig>
  updateGlobalConfig: (config: GlobalConfig) => Promise<void>
  updateConnectorConfig: (config: ConnectorConfig) => Promise<void>
}

export interface IConfigBindingEvents {
  void: () => void
}

export type UiConfigOld = {
  hostApp: string
  darkTheme: boolean
  onboardingCompleted: boolean
}

export type UiConfig = {
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
  darkTheme: boolean
}

export class MockedConfigBinding extends BaseBridge {
  constructor() {
    super()
  }

  private uiConfig: UiConfig = {
    global: {
      onboardingCompleted: false
    },
    connectors: {
      mock: {
        hostApp: 'Mock',
        darkTheme: false
      }
    }
  }

  getConfigOld() {
    return {
      darkTheme: false,
      onboardingCompleted: false
    }
  }

  getConfig() {
    return this.uiConfig
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateGlobalConfig(globalConfig: GlobalConfig) {
    this.uiConfig.global = globalConfig
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateConnectorConfig(connectorConfig: ConnectorConfig) {
    this.uiConfig.connectors[connectorConfig.hostApp.toLowerCase()] = connectorConfig
  }
}
