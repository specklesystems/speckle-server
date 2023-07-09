import { IWebUiBinding } from '~/types'
import { createNanoEvents, Emitter } from 'nanoevents'
import { HostAppEvents } from '~/types'

export class CefSharpBridge {
  private emitter: Emitter

  constructor(bindingObject: IWebUiBinding) {
    const hoistTarget = this as unknown as Record<string, unknown>
    const hoistSource = bindingObject as unknown as Record<string, unknown>

    for (const key in bindingObject) {
      hoistTarget[key] = hoistSource[key]
    }

    this.emitter = createNanoEvents<HostAppEvents>()
    this.emitter.emit('start', 'polo pasta')
  }

  on<E extends keyof HostAppEvents>(event: E, callback: HostAppEvents[E]) {
    return this.emitter.on(event, callback)
  }

  emit(eventName: string, payload: string) {
    const parsedPayload = JSON.parse(payload) as unknown
    this.emitter.emit(eventName, parsedPayload)
  }
}
