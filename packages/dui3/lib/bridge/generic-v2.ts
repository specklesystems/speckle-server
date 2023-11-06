import { BaseBridge } from '~/lib/bridge/base'
import { IRawBridge } from '~/lib/bridge/definitions'

/**
 * A generic bridge class for Webivew2 or CefSharp.
 */
export class GenericBridge extends BaseBridge {
  private bridge: IRawBridge
  private requests = {} as Record<
    string,
    {
      methodName: string
      resolve: (value: unknown) => void
      reject: (reason: string | Error) => void
      rejectTimerId: number
    }
  >
  private TIMEOUT_MS = 1000 * 10 // 2s

  constructor(object: IRawBridge) {
    super()
    this.bridge = object
  }

  public async create(): Promise<boolean> {
    // NOTE: GetMethods is a call to the .NET side.
    let availableMethodNames = [] as string[]
    console.log(this.bridge)

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
    const requestId = (Math.random() + 1).toString(36).substring(2)
    const preserializedArgs = args.map((a) => JSON.stringify(a))

    this.bridge.RunMethod(methodName, requestId, JSON.stringify(preserializedArgs))

    return new Promise((resolve, reject) => {
      this.requests[requestId] = {
        methodName,
        resolve,
        reject,
        rejectTimerId: window.setTimeout(() => {
          reject(
            `.NET response timed out for call to ${methodName} - did not receive anything back in good time (${this.TIMEOUT_MS}ms).`
          )
          delete this.requests[requestId]
        }, this.TIMEOUT_MS)
      }
    })
  }

  private async responseReady(requestId: string) {
    if (!this.requests[requestId])
      throw new Error(
        `.NET Bridge found no request to resolve with the id of ${requestId}. Something is weird!`
      )

    const request = this.requests[requestId]
    const data = await this.bridge.GetCallResult(requestId)
    try {
      const parsedData = data ? (JSON.parse(data) as Record<string, unknown>) : null // TODO: check if data is undefined

      // eslint-disable-next-line no-prototype-builtins
      if (parsedData && parsedData.hasOwnProperty('error')) {
        console.error(data)
        throw new Error(
          `Failed to run ${requestId}. The host app error is logged above.`
        )
      }
      request.resolve(parsedData)
    } catch (e) {
      console.error(e)
      request.reject(e as Error)
    } finally {
      window.clearTimeout(request.rejectTimerId)
      delete this.requests[requestId]
    }
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
