// import { IWebUiBinding, MockedBindings } from '~/types'
// import { WebView2Bridge } from '~/lib/bridge/webview'
// import { CefSharpBridge } from '~/lib/bridge/cefSharp'
// import { SketchupBridge } from '~/lib/bridge/sketchup'

// interface ICefSharp {
//   BindObjectAsync: (arg: string) => Promise<void>
// }

// interface IWebView2 {
//   webview: unknown
// }

// declare let CefSharp: ICefSharp
// declare let chrome: IWebView2
// declare let sketchup: Record<string, unknown>

// declare let WebUIBinding: IWebUiBinding

// Tries to find the correct host application binding. The sequence is:
// - CEFSharp (.NET)
// - WebView2 (.NET)
// - Sketchup (Ruby) - NOT IMPLEMENTED
export default defineNuxtPlugin(async () => {
  // let bindings: IWebUiBinding | undefined = undefined
  // try {
  //   if (!CefSharp) throw new Error('No global CefSharp object found.')
  //   await CefSharp.BindObjectAsync('WebUIBinding')
  //   console.info('Bound WebUIBinding object for CefSharp.')
  //   bindings = new CefSharpBridge(WebUIBinding) as unknown as IWebUiBinding
  // } catch (e) {
  //   console.warn(
  //     'Failed to bind CefSharp. This can be totally normal if the host is different.'
  //   )
  //   console.warn(e)
  // }
  // try {
  //   if (!chrome.webview) throw new Error('No global Webview2 object found.')
  //   bindings = new WebView2Bridge('WebUIBinding') as unknown as IWebUiBinding
  //   console.info('Bound WebUIBinding object for Webview2.')
  // } catch (e) {
  //   console.warn(
  //     'Failed to bind Webview2. This can be totally normal if the host is different.'
  //   )
  //   console.warn(e)
  // }
  // // The sketchup ruby side is in flux. We know though that
  // // this part will work! Nevertheless, it will currently throw if loaded in sketchup.
  // try {
  //   if (!sketchup) throw new Error('No global sketchup object found.')
  //   console.info('Found Sketchup. Hi SketchUp! We have yet... a lot of work to do :) ')
  //   const skpBindings = new SketchupBridge('default_bindings')
  //   // Note, because of the way Sketchup bindings work, we need to wait here
  //   // for them to be fully initialized.
  //   await skpBindings.isInitalized
  //   bindings = skpBindings as unknown as IWebUiBinding
  // } catch (e) {
  //   console.warn(
  //     'Failed to bind sketchup. This can be totally normal if the host is different.'
  //   )
  //   console.warn(e)
  // }
  // if (!bindings) {
  //   console.warn('No bindings found - falling back to mocked bindings.')
  //   bindings = MockedBindings
  // }
  // // We need the bindings object in global scope to allow
  // // host applications to send messages back to it.
  // ;(globalThis as Record<string, unknown>).bindings = bindings
  // return {
  //   provide: {
  //     bindings
  //   }
  // }
})
