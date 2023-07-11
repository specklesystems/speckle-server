// github.com/johot/WebView2-better-bridge/blob/master/web-ui/src/betterBridge.ts
import { BaseBridge } from '~/lib/bridge/base'

type IWebView2 = {
  webview: {
    hostObjects: Record<string, IRawBridge> & {
      sync: Record<string, IRawBridge>
    }
  }
}

type IRawBridge = {
  GetMethods: () => string[]
  RunMethod: (methodName: string, args: string) => Promise<string>
}

declare let chrome: IWebView2

export class WebView2Bridge extends BaseBridge {
  private webViewBridge: IRawBridge

  constructor(bridgeName: string) {
    super()
    this.webViewBridge = chrome.webview.hostObjects[bridgeName]

    // NOTE: GetMethods is a call to the .NET side.
    const availableMethodNames =
      chrome.webview.hostObjects.sync[bridgeName].GetMethods()

    // NOTE: hoisting original calls as lowerCasedMethodNames, but using the UpperCasedName for the .NET call
    // This allows us to follow js convetions and keep .NET ones too (eg. bindings.sayHi('') => public string SayHi(string name) {}
    for (const methodName of availableMethodNames) {
      const lowercasedMethodName = lowercaseMethodName(methodName)
      const hoistTarget = this as unknown as Record<string, object>
      hoistTarget[lowercasedMethodName] = (...args: unknown[]) =>
        this.runMethod(methodName, args)
    }
  }

  private async runMethod(methodName: string, args: unknown[]): Promise<unknown> {
    const preserializedArgs = args.map((a) => JSON.stringify(a))
    // NOTE: RunMethod is a call to the .NET side.
    const result = await this.webViewBridge.RunMethod(
      methodName,
      JSON.stringify(preserializedArgs)
    )

    return JSON.parse(result) as unknown
  }
}

const lowercaseMethodName = (name: string) =>
  name.charAt(0).toLowerCase() + name.slice(1)
