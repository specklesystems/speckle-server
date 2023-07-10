// TODO
import { uniqueId } from 'lodash-es'

declare let sketchup: {
  exec: (data: Record<string, unknown>) => void
}

/**
 * This class operates in different way than the others, because calls into Sketchup are one way only.
 * E.g., we cannot return values from internal calls to it (e.g., const test = sketchup.rubyCall() does not work ).
 * Values are passed back
 */
export class SketchupBridge {
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
    this.bindingsName = bindingsName || 'default_bindings'

    // Initialization continues in the receiveCommandsAndInitializeBridge function,
    // where we expect sketchup to return to us the command names.
    sketchup.exec({ name: 'get_commands' })

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
  }

  /**
   * Will be called by `executeScript('bindings.receiveCommandsAndInitializeBridge()')` from sketchup. This is where the hoisting happens.
   * NOTE: Oguhzan, we can defintively have commandNames be a string, and not a string[]
   * And do JSON.parse() here to get them out properly.
   * @param commandNames
   */
  private receiveCommandsAndInitializeBridge(commandNames: string[]) {
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

    sketchup.exec({ name: methodName, requestId, args })

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
      const parsedData = JSON.parse(data) as Record<string, unknown> // TODO: check if data is undefined
      request.resolve(parsedData)
    } catch (e) {
      request.reject(e as Error)
    } finally {
      window.clearTimeout(request.rejectTimerId)
      delete this.requests[requestId]
    }
  }
}
