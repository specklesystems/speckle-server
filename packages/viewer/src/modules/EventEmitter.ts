/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/*
 * https://medium.com/better-programming/how-to-create-your-own-event-emitter-in-javascript-fbd5db2447c4
 */
export default class EventEmitter {
  protected _events: Record<string, Function[]>

  constructor() {
    this._events = {}
  }

  on(name: string, listener: Function) {
    if (!this._events[name]) {
      this._events[name] = []
    }

    this._events[name].push(listener)
  }

  removeListener(name: string, listenerToRemove: Function) {
    if (!this._events[name]) return

    const filterListeners = (listener: Function) => listener !== listenerToRemove

    this._events[name] = this._events[name].filter(filterListeners)
  }

  emit(name: string, ...args: unknown[]) {
    if (!this._events[name]) return

    const fireCallbacks = (callback: Function) => {
      callback(...args)
    }

    this._events[name].forEach(fireCallbacks)
  }

  dispose() {
    this._events = {}
  }
}
