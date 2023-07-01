import { ICefSharp, WebUiBindingType, MockedBindings } from '~/types'

declare let CefSharp: ICefSharp
declare let WebUIBinding: WebUiBindingType

export default defineNuxtPlugin(async () => {
  let bindings: WebUiBindingType

  try {
    if (!CefSharp) throw new Error('No global CefSharp object found.')
    await CefSharp.BindObjectAsync('WebUIBinding')
    console.info('Bound WebUIBinding object for CefSharp.')
    bindings = WebUIBinding
  } catch (e) {
    console.error('Failed to bind CefSharp, will use mocked bindings.')
    console.error(e)

    bindings = MockedBindings
  }

  return {
    provide: {
      bindings
    }
  }
})
