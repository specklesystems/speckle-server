// github.com/johot/WebView2-better-bridge/blob/master/web-ui/src/betterBridge.ts
import { BaseBridge } from '~/lib/bridge/base'

export type IRawBridge = {
  GetBindingsMethodNames: () => Promise<string[]>
  RunMethod: (methodName: string, args: string) => Promise<string>
  ShowDevTools: () => Promise<void>
}

export class GenericBridge extends BaseBridge {
  private bridge: IRawBridge

  constructor(object: IRawBridge) {
    super()
    this.bridge = object
  }

  public async create() {
    // NOTE: GetMethods is a call to the .NET side.
    const availableMethodNames = await this.bridge.GetBindingsMethodNames()

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
    const result = await this.bridge.RunMethod(
      methodName,
      JSON.stringify(preserializedArgs)
    )

    return JSON.parse(result) as unknown
  }
}

const lowercaseMethodName = (name: string) =>
  name.charAt(0).toLowerCase() + name.slice(1)
