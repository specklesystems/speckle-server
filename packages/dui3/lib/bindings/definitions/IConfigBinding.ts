import { BaseBridge } from '~~/lib/bridge/base'
import type { IBinding } from '~~/lib/bindings/definitions/IBinding'

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
  darkTheme: boolean
}

export class MockedConfigBinding extends BaseBridge {
  getConfig() {
    return {
      darkTheme: false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateConfig(config: Config) {
    // do nothing
  }
}
