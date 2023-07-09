import { IWebUiBinding } from '~/types'

export class SketchupBindings implements IWebUiBinding {
  requestId = 0
  requests = {} as Record<number, unknown>

  SketchupBindings() {
    // todo
  }

  getAccounts() {
    this.requestId++
    this.requests[this.requestId] = new Promise((resolve, reject) => resolve('[]'))

    return this.requests[this.requestId] as Promise<string>
  }

  async sayHi(name: string) {
    return `Hi ${name} from (sketchup mocked bindings)!`
  }

  getSourceAppName() {
    return new Promise((resolve, reject) => resolve('sketchup')) as Promise<string>
  }

  async openDevTools() {
    // eslint-disable-next-line no-alert
    window.alert('Please right click and select show dev tools.')
  }
}
