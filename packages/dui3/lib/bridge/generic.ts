import { BaseBridge } from '~/lib/bridge/base'
import type { IRawBridge } from '~/lib/bridge/definitions'
/**
 * A generic bridge class for Webivew2 or CefSharp.
 */
export class GenericBridge extends BaseBridge {
  private bridge: IRawBridge

  constructor(object: IRawBridge) {
    super()
    this.bridge = object
  }

  public async create(): Promise<boolean> {
    // NOTE: GetMethods is a call to the .NET side.
    let availableMethodNames = [] as string[]

    try {
      availableMethodNames = await this.bridge.GetBindingsMethodNames()
    } catch (e) {
      console.warn(`Failed to get method names.`)
      return false
    }

    // NOTE: hoisting original calls as lowerCasedMethodNames, but using the UpperCasedName for the .NET call
    // This allows us to follow js convetions and keep .NET ones too (eg. bindings.sayHi('') => public string SayHi(string name) {}
    for (const methodName of availableMethodNames) {
      const lowercasedMethodName = lowercaseMethodName(methodName)
      const hoistTarget = this as unknown as Record<string, object>
      hoistTarget[lowercasedMethodName] = (...args: unknown[]) =>
        this.runMethod(methodName, args)
    }

    return true
  }

  private async runMethod(methodName: string, args: unknown[]): Promise<unknown> {
    const preserializedArgs = args.map((a) => JSON.stringify(a))

    // NOTE: RunMethod is a call to the .NET side.
    const result = await this.bridge.RunMethod(
      methodName,
      JSON.stringify(preserializedArgs)
    )

    const parsed = result ? (JSON.parse(result) as Record<string, unknown>) : null

    if (parsed && parsed['error']) {
      console.error(parsed)
      throw new Error(
        `Failed to run ${methodName} with args ${JSON.stringify(
          args
        )}. The host app error is logged above.`
      )
    }

    return parsed
  }

  public showDevTools() {
    this.bridge.ShowDevTools()
  }

  public openUrl(url: string) {
    this.bridge.OpenUrl(url)
  }
}

const lowercaseMethodName = (name: string) =>
  name.charAt(0).toLowerCase() + name.slice(1)
