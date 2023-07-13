import { GenericBridge, IRawBridge } from '~/lib/bridge/generic'
import {
  IBaseBinding,
  IRhinoRandomBinding
} from '~/lib/bindings/definitions/baseBindings'
import { SketchupBridge } from '~/lib/bridge/sketchup'

// Makes TS happy
declare let globalThis: Record<string, unknown> & {
  CefSharp?: { BindObjectAsync: (name: string) => Promise<void> }
  chrome?: { webview: { hostObjects: Record<string, IRawBridge> } }
  sketchup?: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/require-await
const tryHoistBinding = async <T>(name: string) => {
  let bridge: GenericBridge | SketchupBridge | null = null

  if (globalThis.CefSharp) {
    await globalThis.CefSharp.BindObjectAsync(name)
    bridge = new GenericBridge(globalThis[name] as unknown as IRawBridge)
    await bridge.create()
  }

  if (globalThis.chrome && globalThis.chrome.webview && !bridge) {
    bridge = new GenericBridge(globalThis.chrome.webview.hostObjects[name])
    await bridge.create()
  }

  if (globalThis.sketchup && !bridge) {
    bridge = new SketchupBridge(name)
    const res = await bridge.isInitalized
    // If bridge doesn't initialized succesffuly, then do not create binding
    if (!res) bridge = null
  }

  if (!bridge) console.warn(`Failed to bind ${name} binding.`)

  globalThis[name] = bridge
  return bridge as unknown as T
}

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
