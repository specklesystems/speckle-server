import { uniqueId } from 'lodash-es'
import { BaseBridge } from './base'

declare let sketchup: {
  exec: (data: Record<string, unknown>) => void
}

/**
 * This class operates in different way than the others, because calls into Sketchup are one way only.
 * E.g., we cannot return values from internal calls to it (e.g., const test = sketchup.rubyCall() does not work ).
 * This class basically makes the sketchup bindings work in the same way as cef/webview by returning a promise
 * on each method call. That promise is either resolved once sketchup sends back (via receiveResponse) a corresponding
 * reply, or it's rejected after a given TIMEOUT_MS (currently 2s).
 * TODO: implement the event dispatcher side as well.
 */
export class SketchupBridge extends BaseBridge {
  private requests = {} as Record<
    string,
    {
      resolve: (value: unknown) => void
      reject: (reason: string | Error) => void
      rejectTimerId: number
    }
  >
  private bindingsName: string
  private TIMEOUT_MS = 2000 // 2s
  public isInitalized: Promise<void>
  private resolveIsInitializedPromise!: () => unknown

  constructor(bindingsName: string) {
    super()
    this.bindingsName = bindingsName || 'default_bindings'

    this.isInitalized = new Promise((resolve, reject) => {
      this.resolveIsInitializedPromise = resolve
      setTimeout(
        () =>
          reject(
            `Failed to get command names from Sketchup; timed out after ${this.TIMEOUT_MS}ms.`
          ),
        this.TIMEOUT_MS
      )
    })

    // NOTE: we need to hoist the bindings in global scope BEFORE we call sketchup exec get comands below.
    ;(globalThis as Record<string, unknown>).bindings = this

    // Initialization continues in the receiveCommandsAndInitializeBridge function,
    // where we expect sketchup to return to us the command names.
    // NOTE: as we want to have multiple sketchup bindings in the future, we will
    // most likely change this method to specify which view/plugin/bindings we want.
    sketchup.exec({ name: 'get_commands' })
  }

  /**
   * Will be called by `executeScript('bindings.receiveCommandsAndInitializeBridge()')` from sketchup. This is where the hoisting happens.
   * NOTE: Oguhzan, we can defintively have commandNames be a string, and not a string[]
   * And do JSON.parse() here to get them out properly.
   * @param commandNames
   */
  private receiveCommandsAndInitializeBridge(commandNamesString: string) {
    const commandNames = JSON.parse(commandNamesString) as string[]
    const hoistTarget = this as unknown as Record<string, unknown>
    for (const commandName of commandNames) {
      hoistTarget[commandName] = (...args: unknown[]) =>
        this.runMethod(commandName, args)
    }

    this.resolveIsInitializedPromise()
  }

  /**
   * Internal calls to Sketchup.
   * @param methodName
   * @param args
   */
  private async runMethod(methodName: string, args: unknown[]): Promise<unknown> {
    const requestId = uniqueId(this.bindingsName)

    // TODO: more on the ruby end, but for now Oguzhan seems happy with this.
    // Changes might be needed in the future.
    sketchup.exec({
      name: methodName,
      // eslint-disable-next-line camelcase
      data: { request_id: requestId, arguments: args }
    })

    return new Promise((resolve, reject) => {
      this.requests[requestId] = {
        resolve,
        reject,
        rejectTimerId: window.setTimeout(() => {
          reject(
            `Sketchup response timed out - did not receive anything back in good time (${this.TIMEOUT_MS}ms).`
          )
          delete this.requests[requestId]
        }, this.TIMEOUT_MS)
      }
    })
  }

  private receiveResponse(requestId: string, data: string) {
    if (!this.requests[requestId])
      throw new Error(
        `Sketchup Bridge found no request to resolve with the id of ${requestId}. Something is weird!`
      )
    const request = this.requests[requestId]
    try {
      // NOTE/TODO: does not need parsing
      // const parsedData = JSON.parse(data) as Record<string, unknown> // TODO: check if data is undefined
      request.resolve(data)
    } catch (e) {
      request.reject(e as Error)
    } finally {
      window.clearTimeout(request.rejectTimerId)
      delete this.requests[requestId]
    }
  }
}
