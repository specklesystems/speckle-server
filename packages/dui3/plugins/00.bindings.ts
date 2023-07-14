import { GenericBridge } from '~/lib/bridge/generic'
import { IRawBridge } from '~/lib/bridge/definitions'

import {
  IBaseBinding,
  IRhinoRandomBinding
} from '~/lib/bindings/definitions/baseBindings'

// Makes TS happy
declare let globalThis: Record<string, unknown> & {
  CefSharp?: { BindObjectAsync: (name: string) => Promise<void> }
  chrome?: { webview: { hostObjects: Record<string, IRawBridge> } }
  sketchup?: Record<string, unknown>
}

/**
 * Here we are loading any bindings that we expect to have from all
 * connectors. If some are not present, that's okay - we're going to
 * strip or customize functionality from the ui itself.
 */
export default defineNuxtPlugin(async () => {
  const baseBinding = await tryHoistBinding<IBaseBinding>('baseBinding')

  const rhinoRandomBinding = await tryHoistBinding<IRhinoRandomBinding>(
    'rhinoRandomBinding'
  )

  return {
    provide: {
      baseBinding,
      rhinoRandomBinding
    }
  }
})

/**
 * Checks possible browser window targets for a given binding, and, if it finds it,
 * creates a bridge for it and registers it in the global scope.
 * @param name binding name
 * @returns null if the binding was not found, or the binding.
 */
const tryHoistBinding = async <T>(name: string) => {
  let bridge: GenericBridge | null = null

  if (globalThis.CefSharp) {
    await globalThis.CefSharp.BindObjectAsync(name)
    bridge = new GenericBridge(globalThis[name] as unknown as IRawBridge)
    await bridge.create()
  }

  if (globalThis.chrome && !bridge) {
    bridge = new GenericBridge(globalThis.chrome.webview.hostObjects[name])
    await bridge.create()
  }

  if (globalThis.sketchup && !bridge) {
    // TODO
  }

  if (!bridge) console.warn(`Failed to bind ${name} binding.`)

  globalThis[name] = bridge
  return bridge as unknown as T
}
