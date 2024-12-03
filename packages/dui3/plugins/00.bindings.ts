import type { IRawBridge } from '~/lib/bridge/definitions'
import { GenericBridge } from '~/lib/bridge/generic-v2'
import { SketchupBridge } from '~/lib/bridge/sketchup'

import type { IBasicConnectorBinding } from '~/lib/bindings/definitions/IBasicConnectorBinding'
import type { IAccountBinding } from '~/lib/bindings/definitions/IAccountBinding'
import { IAccountBindingKey } from '~/lib/bindings/definitions/IAccountBinding'

import type { ITestBinding } from '~/lib/bindings/definitions/ITestBinding'
import { ITestBindingKey } from '~/lib/bindings/definitions/ITestBinding'

import type { IConfigBinding } from '~/lib/bindings/definitions/IConfigBinding'
import { IConfigBindingKey } from '~/lib/bindings/definitions/IConfigBinding'

import { IBasicConnectorBindingKey } from '~/lib/bindings/definitions/IBasicConnectorBinding'

import type { ISendBinding } from '~/lib/bindings/definitions/ISendBinding'
import { ISendBindingKey } from '~/lib/bindings/definitions/ISendBinding'
import type { IReceiveBinding } from '~/lib/bindings/definitions/IReceiveBinding'
import { IReceiveBindingKey } from '~/lib/bindings/definitions/IReceiveBinding'

import type { ISelectionBinding } from '~/lib/bindings/definitions/ISelectionBinding'
import { ISelectionBindingKey } from '~/lib/bindings/definitions/ISelectionBinding'

import type { IHostAppTestBinding } from '~/lib/bindings/definitions/IHostAppTestBinding'
import { IHostAppTestBindingKey } from '~/lib/bindings/definitions/IHostAppTestBinding'

import type { ITopLevelExpectionHandlerBinding } from '~/lib/bindings/definitions/ITopLevelExceptionHandlerBinding'
import { ITopLevelExpectionHandlerBindingKey } from '~/lib/bindings/definitions/ITopLevelExceptionHandlerBinding'

// Makes TS happy
declare let globalThis: Record<string, unknown> & {
  CefSharp?: { BindObjectAsync: (name: string) => Promise<void> }
  chrome?: { webview: { hostObjects: Record<string, IRawBridge> } }
  sketchup?: Record<string, unknown>
  DG?: { LoadObject: (name: string) => Promise<void> }
}

/**
 * Here we are loading any bindings that we expect to have from all
 * connectors. If some are not present, that's okay - we're going to
 * strip or customize functionality from the ui itself.
 */
export default defineNuxtPlugin(async () => {
  // Registers a set of non existent bindings as a test.
  const nonExistantBindings = await tryHoistBinding('nonExistantBindings')

  // Registers some default test bindings.
  const testBindings = await tryHoistBinding<ITestBinding>(ITestBindingKey)

  // Actual bindings follow below.
  const configBinding = await tryHoistBinding<IConfigBinding>(IConfigBindingKey)

  const accountBinding = await tryHoistBinding<IAccountBinding>(IAccountBindingKey)

  const baseBinding = await tryHoistBinding<IBasicConnectorBinding>(
    IBasicConnectorBindingKey
  )

  const sendBinding = await tryHoistBinding<ISendBinding>(ISendBindingKey)

  const receiveBinding = await tryHoistBinding<IReceiveBinding>(IReceiveBindingKey)

  const selectionBinding = await tryHoistBinding<ISelectionBinding>(
    ISelectionBindingKey
  )

  const hostAppTestBiding = await tryHoistBinding<IHostAppTestBinding>(
    IHostAppTestBindingKey
  )

  const topLevelExceptionHandlerBinding =
    await tryHoistBinding<ITopLevelExpectionHandlerBinding>(
      ITopLevelExpectionHandlerBindingKey
    )

  // Any binding implments these two methods below, we just choose one to
  // expose globally to the app.
  const showDevTools = () => {
    configBinding.showDevTools()
  }

  const openUrl = (url: string) => {
    configBinding.openUrl(url)
  }

  return {
    provide: {
      nonExistantBindings,
      testBindings,
      configBinding,
      accountBinding,
      baseBinding,
      sendBinding,
      receiveBinding,
      selectionBinding,
      topLevelExceptionHandlerBinding,
      hostAppTestBiding,
      showDevTools,
      openUrl
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
  let bridge: GenericBridge | SketchupBridge | null = null
  let tempBridge: GenericBridge | SketchupBridge | null = null

  if (globalThis.chrome && globalThis.chrome.webview && !tempBridge) {
    tempBridge = new GenericBridge(globalThis.chrome.webview.hostObjects[name])
  }

  if (globalThis.sketchup && !tempBridge) {
    tempBridge = new SketchupBridge(name)
  }

  if (globalThis.CefSharp && globalThis.DG && !tempBridge) {
    await globalThis.CefSharp.BindObjectAsync(name)
    tempBridge = new GenericBridge(globalThis[name] as unknown as IRawBridge, true)
  }

  if (globalThis.CefSharp && !tempBridge) {
    await globalThis.CefSharp.BindObjectAsync(name)
    tempBridge = new GenericBridge(globalThis[name] as unknown as IRawBridge)
  }

  const res = await tempBridge?.create()
  if (res) bridge = tempBridge

  if (!bridge) {
    console.warn(`Failed to bind ${name} binding.`)
    return bridge as unknown as T
  }

  globalThis[name] = bridge
  console.log(
    `%c✔ ${name} connector binding added succesfully.`,
    'color: green; font-weight: bold; font-size: small'
  )
  return bridge as unknown as T
}

// const hoistMockBinding = (mockBinding: BaseBridge, name: string) => {
//   globalThis[name] = mockBinding
//   console.log(
//     `%c✔ Mocked ${name} binding added succesfully.`,
//     'color: green; font-weight: bold; font-size: small'
//   )
//   return mockBinding
// }
