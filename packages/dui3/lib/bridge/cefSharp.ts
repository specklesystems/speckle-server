import { IWebUiBinding } from '~/types'
import { BaseBridge } from '~/lib/bridge/base'

export class CefSharpBridge extends BaseBridge {
  constructor(bindingObject: IWebUiBinding) {
    super()
    const hoistTarget = this as unknown as Record<string, unknown>
    const hoistSource = bindingObject as unknown as Record<string, unknown>

    for (const key in bindingObject) {
      hoistTarget[key] = hoistSource[key]
    }
  }
}
