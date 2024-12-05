import { ServerBridge } from '~/lib/bridge/server'
import { BaseBridge } from '~/lib/bridge/base'
import type { IRawBridge } from '~/lib/bridge/definitions'

/**
 * A generic bridge class for Webivew2 or CefSharp.
 */
export class GenericBridge extends BaseBridge {
  private bridge: IRawBridge
  private serverBridge: ServerBridge | undefined
  private requests = {} as Record<
    string,
    {
      methodName: string
      resolve: (value: unknown) => void
      reject: (reason: string | Error) => void
      rejectTimerId: number
    }
  >
  // TOTHINK: as this is a fast timeout, it forces us for long await methods in .net to return results via events. Kind-of not cool, and i'd be in favour of bumping it to "endless", or remove it altogether
  // An example is the send or receive operations: they can take fucking long :D
  private TIMEOUT_MS = 1000 * 60 // 60 sec

  constructor(object: IRawBridge, isServerBridge: boolean = false) {
    super()
    this.bridge = object
    if (isServerBridge) {
      this.serverBridge = new ServerBridge(this.runMethod, this.emitter)
    }
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

  private async emitResponseReady(eventName: string, requestId: string) {
    this.registerPromise(eventName, requestId)
    const data = await this.bridge.GetCallResult(requestId)
    const request = this.requests[requestId]
    try {
      const parsedData = data ? (JSON.parse(data) as Record<string, unknown>) : null

      if (parsedData === null) {
        throw new Error(`Data is not parsed successfuly on ${eventName}`)
      }

      if (this.serverBridge) {
        this.serverBridge.emit(eventName, parsedData, this.runMethod)
      } else {
        this.emitter.emit(eventName, parsedData)
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

  async runMethod(methodName: string, args: unknown[]): Promise<unknown> {
    const requestId = (Math.random() + 1).toString(36).substring(2) + '_' + methodName
    const preserializedArgs = args.map((a) => JSON.stringify(a))

    this.bridge.RunMethod(methodName, requestId, JSON.stringify(preserializedArgs))

    return this.registerPromise(methodName, requestId)
  }

  private async registerPromise(methodName: string, requestId: string) {
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
        this.emitter.emit('errorOnResponse', data)
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
