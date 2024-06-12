import type { Emitter } from 'nanoevents'
import { createNanoEvents } from 'nanoevents'

/**
 * A simple (typed) event emitter base class that host applications can use to send messages (and data) to the web ui,
 * e.g. via `browser.executeScriptAsync("myBindings.on('eventName', serializedData)")`.
 */
export class BaseBridge {
  public emitter: Emitter

  constructor() {
    this.emitter = createNanoEvents()
  }

  // NOTE: these do not need to be typed extra in here, as they will be properly typed on the specific binding's interface.
  on(event: string | number, callback: (...args: unknown[]) => void) {
    return this.emitter.on(event, callback)
  }

  // NOTE: this could be private - as it should be only used by the host application.
  emit(eventName: string, payload: string) {
    const parsedPayload = payload ? (JSON.parse(payload) as unknown) : null
    this.emitter.emit(eventName, parsedPayload)
  }
}
