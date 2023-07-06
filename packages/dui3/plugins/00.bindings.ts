import { ICefSharp, IWebViev, WebUiBindingType, MockedBindings } from '~/types'

declare let CefSharp: ICefSharp
declare let chrome: IWebViev
declare let WebUIBinding: WebUiBindingType

export default defineNuxtPlugin(async () => {
  let bindings: WebUiBindingType | undefined = undefined

  try {
    if (!CefSharp) throw new Error('No global CefSharp object found.')
    await CefSharp.BindObjectAsync('WebUIBinding')
    console.info('Bound WebUIBinding object for CefSharp.')
    bindings = WebUIBinding
  } catch (e) {
    console.warn('Failed to bind CefSharp.')
    console.warn(e)
  }

  try {
    if (!chrome.webview) throw new Error('No global Webview2 object found.')
    bindings = chrome.webview.hostObjects.WebUIBinding
    console.info('Bound WebUIBinding object for Webview2.')
    const res = await bindings.sayHi('Test')
    console.log(res)
  } catch (e) {
    console.warn('Failed to bind Webview2.')
    console.warn(e)
  }

  // TODO: continue falling back for things like sketchup, rhino mac (which would use shitty url hacking scheme stuff)

  if (!bindings) {
    console.warn('No bindings found - falling back to mocked bindings.')
    bindings = MockedBindings
  }

  return {
    provide: {
      bindings
    }
  }
})
