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
  onboardingSkipped: boolean
  onboardings: OnboardingDictionary
}

export type ConnectorConfig = {
  hostApp: string
  darkTheme: boolean
  onboardings: OnboardingDictionary
}

export type OnboardingDictionary = {
  [id: string]: OnboardingData
}

export type OnboardingData = {
  title: string
  blurb: string
  completed: boolean
  page: string
}

export class MockedConfigBinding extends BaseBridge {
  constructor() {
    super()
  }

  private uiConfig: UiConfig = {
    global: {
      onboardingSkipped: false,
      onboardings: {
        send: {
          title: 'Send',
          blurb: 'Send first model to Speckleverse!',
          completed: false,
          page: '/onboarding/send'
        },
        receive: {
          title: 'Receive',
          blurb: 'Receive first model from Speckleverse!',
          completed: false,
          page: '/onboarding/receive'
        }
      }
    },
    connectors: {
      mock: {
        hostApp: 'Mock',
        darkTheme: false,
        onboardings: {
          test: {
            title: 'Test',
            blurb: 'Initial Test',
            completed: false,
            page: '/onboarding/test'
          }
        }
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
