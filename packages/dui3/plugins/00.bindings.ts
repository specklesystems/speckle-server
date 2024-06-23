import type { IRawBridge } from '~/lib/bridge/definitions'
import { GenericBridge } from '~/lib/bridge/generic-v2'
import { SketchupBridge } from '~/lib/bridge/sketchup'
import type { BaseBridge } from '~~/lib/bridge/base'

import type { IBasicConnectorBinding } from '~/lib/bindings/definitions/IBasicConnectorBinding'
import type { IAccountBinding } from '~/lib/bindings/definitions/IAccountBinding'
import {
  IAccountBindingKey,
  MockedAccountBinding
} from '~/lib/bindings/definitions/IAccountBinding'

import type { ITestBinding } from '~/lib/bindings/definitions/ITestBinding'
import {
  ITestBindingKey,
  MockedTestBinding
} from '~/lib/bindings/definitions/ITestBinding'

import type { IConfigBinding } from '~/lib/bindings/definitions/IConfigBinding'
import {
  IConfigBindingKey,
  MockedConfigBinding
} from '~/lib/bindings/definitions/IConfigBinding'

import {
  IBasicConnectorBindingKey,
  MockedBaseBinding
} from '~/lib/bindings/definitions/IBasicConnectorBinding'

import type { ISendBinding } from '~/lib/bindings/definitions/ISendBinding'
import { ISendBindingKey } from '~/lib/bindings/definitions/ISendBinding'
import type { IReceiveBinding } from '~/lib/bindings/definitions/IReceiveBinding'
import { IReceiveBindingKey } from '~/lib/bindings/definitions/IReceiveBinding'

import type { ISelectionBinding } from '~/lib/bindings/definitions/ISelectionBinding'
import {
  ISelectionBindingKey,
  MockedSelectionBinding
} from '~/lib/bindings/definitions/ISelectionBinding'

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
  // Registers a set of non existent bindings as a test.
  const nonExistantBindings = await tryHoistBinding('nonExistantBindings')

  // Registers some default test bindings.
  const testBindings =
    (await tryHoistBinding<ITestBinding>(ITestBindingKey)) ||
    hoistMockBinding(new MockedTestBinding(), ITestBindingKey)

  // Actual || mock bindings follow below.
  const configBinding =
    (await tryHoistBinding<IConfigBinding>(IConfigBindingKey)) ||
    hoistMockBinding(new MockedConfigBinding(), IConfigBindingKey)

  const accountBinding =
    (await tryHoistBinding<IAccountBinding>(IAccountBindingKey)) ||
    hoistMockBinding(new MockedAccountBinding(), IAccountBindingKey)

  const baseBinding =
    (await tryHoistBinding<IBasicConnectorBinding>(IBasicConnectorBindingKey)) ||
    hoistMockBinding(new MockedBaseBinding(), IBasicConnectorBindingKey)

  const sendBinding = await tryHoistBinding<ISendBinding>(ISendBindingKey)

  const receiveBinding = await tryHoistBinding<IReceiveBinding>(IReceiveBindingKey)

  const selectionBinding =
    (await tryHoistBinding<ISelectionBinding>(ISelectionBindingKey)) ||
    hoistMockBinding(new MockedSelectionBinding(), ISelectionBindingKey)

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

  if (globalThis.CefSharp) {
    await globalThis.CefSharp.BindObjectAsync(name)
    tempBridge = new GenericBridge(globalThis[name] as unknown as IRawBridge)
  }

  if (globalThis.chrome && globalThis.chrome.webview && !tempBridge) {
    tempBridge = new GenericBridge(globalThis.chrome.webview.hostObjects[name])
  }

  if (globalThis.sketchup && !tempBridge) {
    tempBridge = new SketchupBridge(name)
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

const hoistMockBinding = (mockBinding: BaseBridge, name: string) => {
  globalThis[name] = mockBinding
  console.log(
    `%c✔ Mocked ${name} binding added succesfully.`,
    'color: green; font-weight: bold; font-size: small'
  )
  return mockBinding
}
