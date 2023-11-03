/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~~/lib/bridge/base'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

/**
 * The name under which this binding will be registered.
 */
export const IUiConfigBindingKey = 'uiConfigBinding'

/**
 * A test binding interface to ensure compatbility. Ideally all host environments would implement and register it.
 */
export interface IUiConfigBinding extends IBinding<IUiConfigBindingEvents> {
  getConfig: (hostAppName: string) => Promise<UiConfig>
  updateConfig: (config: UiConfig, hostAppName: string) => Promise<void>
}

export interface IUiConfigBindingEvents {
  void: () => void
}

export type UiConfig = {
  darkTheme: boolean
  onboardingCompleted: boolean
}

export class MockedConfigBinding extends BaseBridge {
  constructor() {
    super()
  }

  getConfig() {
    return {
      darkTheme: false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateConfig(config: UiConfig) {
    // do nothing
  }
}
