import { IWebUiBinding, MockedBindings } from '~/types'
import { WebView2Bridge } from '~/lib/bridge/webview'
import { CefSharpBridge } from '~/lib/bridge/cefSharp'

interface ICefSharp {
  BindObjectAsync: (arg: string) => Promise<void>
}

interface IWebView2 {
  webview: unknown
}

declare let CefSharp: ICefSharp
declare let chrome: IWebView2
declare let sketchup: Record<string, unknown>

declare let WebUIBinding: IWebUiBinding

// Tries to find the correct host application binding. The sequence is:
// - CEFSharp (.NET)
// - WebView2 (.NET)
// - Sketchup (Ruby) - NOT IMPLEMENTED
export default defineNuxtPlugin(async () => {
  let bindings: IWebUiBinding | undefined = undefined

  try {
    if (!CefSharp) throw new Error('No global CefSharp object found.')
    await CefSharp.BindObjectAsync('WebUIBinding')
    console.info('Bound WebUIBinding object for CefSharp.')
    bindings = new CefSharpBridge(WebUIBinding) as unknown as IWebUiBinding
  } catch (e) {
    console.warn('Failed to bind CefSharp.')
    console.warn(e)
  }

  try {
    if (!chrome.webview) throw new Error('No global Webview2 object found.')
    bindings = new WebView2Bridge('WebUIBinding') as unknown as IWebUiBinding
    console.info('Bound WebUIBinding object for Webview2.')

    const res = await bindings.sayHi('Test')
    console.log(res)
  } catch (e) {
    console.warn('Failed to bind Webview2.')
    console.warn(e)
  }

  try {
    if (!sketchup) throw new Error('No global sketchup object found.')
    console.info('Found Sketchup. Hi SketchUp! We have yet... a lot of work to do :) ')
    // TODO
  } catch (e) {
    console.warn('Failed to bind sketchup.')
    console.warn(e)
  }

  if (!bindings) {
    console.warn('No bindings found - falling back to mocked bindings.')
    bindings = MockedBindings
  }

  ;(globalThis as Record<string, unknown>).bindings = bindings

  bindings.on('test', (args) => {
    console.log(args)
  })

  return {
    provide: {
      bindings
    }
  }
})
