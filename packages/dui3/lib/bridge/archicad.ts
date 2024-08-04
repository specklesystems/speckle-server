import type { IRawBridge } from '~/lib/bridge/definitions'
import { ServerBridge } from '~/lib/bridge/server'

declare let DG: {
  runMethod: (data: Record<string, unknown>) => void
  getBindingsMethodNames: (bindingName: string) => void
}

export class ArchicadBridge extends ServerBridge {
  private bridge: IRawBridge

  constructor(object: IRawBridge, bindingName: string) {
    super(bindingName)
    this.bridge = object
  }

  protected execMethod(methodName: string, requestId: string, args: unknown[]): void {
    DG.runMethod({
      name: methodName,
      // eslint-disable-next-line camelcase
      request_id: requestId,
      // eslint-disable-next-line camelcase
      binding_name: this.bindingName,
      data: { args }
    })
  }

  public async create(): Promise<boolean> {
    // NOTE: GetMethods is a call to the .NET side.
    let availableMethodNames = [] as string[]

    try {
      availableMethodNames = await this.bridge.GetBindingsMethodNames()
    } catch (e) {
      console.warn(`Failed to get method names from binding.`)
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
}

const lowercaseMethodName = (name: string) =>
  name.charAt(0).toLowerCase() + name.slice(1)
