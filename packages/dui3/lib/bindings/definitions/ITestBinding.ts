/* eslint-disable @typescript-eslint/require-await */

import { BaseBridge } from '~~/lib/bridge/base'
import type { IBinding } from '~~/lib/bindings/definitions/IBinding'

/**
 * The name under which this binding will be registered.
 */
export const ITestBindingKey = 'testBinding'

/**
 * A test binding interface to ensure compatbility. Ideally all host environments would implement and register it.
 */
export interface ITestBinding extends IBinding<ITestBindingEvents> {
  sayHi: (name: string, count: number, sayHelloNotHi: boolean) => Promise<string[]>
  goAway: () => Promise<void>
  getComplexType: () => Promise<ComplexType>
  shouldThrow: () => Promise<void>
  triggerEvent: (eventName: string) => Promise<void>
}

export interface ITestBindingEvents {
  emptyTestEvent: () => void
  testEvent: (args: TestEventArgs) => void
}

export type TestEventArgs = {
  name: string
  isOk: boolean
  count: number
}

export type ComplexType = {
  id: string
  count: number
}

export class MockedTestBinding extends BaseBridge {
  public async sayHi(name: string, count: number, sayHelloNotHi: boolean) {
    return `Hello from mocked bindings. Args: name = ${name}, count = ${count}, sayHelloNotHi = ${sayHelloNotHi.toString()}.`
  }

  public async goAway() {
    return
  }

  public async getComplexType() {
    return { id: 'wow', count: 42 }
  }

  public async shouldThrow() {
    return
  }

  public async triggerEvent(eventName: string) {
    return eventName
  }
}
