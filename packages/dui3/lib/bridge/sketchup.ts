import { uniqueId } from 'lodash-es'
import { BaseBridge } from './base'
import { CreateVersionArgs } from 'lib/bindings/definitions/ISendBinding'

declare let sketchup: {
  exec: (data: Record<string, unknown>) => void
  getCommands: (viewId: string) => void
}

type SendViaBrowserArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  token: string
  serverUrl: string
  accountId: string
  message: string
  sendObject: {
    id: string // the root object id which should be used for creating the version
    totalChildrenCount: number
    batches: string[]
  }
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
  private bindingName: string
  private TIMEOUT_MS = 2000 // 2s
  public isInitalized: Promise<boolean>
  private resolveIsInitializedPromise!: (v: boolean) => unknown
  private rejectIsInitializedPromise!: (message: string) => unknown

  constructor(bindingName: string) {
    super()
    this.bindingName = bindingName || 'default_bindings'

    this.isInitalized = new Promise((resolve, reject) => {
      this.resolveIsInitializedPromise = resolve
      this.rejectIsInitializedPromise = reject
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
  }

  // NOTE: Overriden emit as we do not need to parse the data back - the Sketchup bridge already parses it for us.
  emit(eventName: string, payload: string): void {
    const eventPayload = payload as unknown as Record<string, unknown>

    if (eventName !== 'sendViaBrowser')
      return this.emitter.emit(eventName, eventPayload)

    this.sendViaBrowser(eventPayload as SendViaBrowserArgs)
  }

  /**
   * Internal sketchup method for sending data via the browser.
   * @param eventPayload
   */
  private async sendViaBrowser(eventPayload: SendViaBrowserArgs) {
    const {
      serverUrl,
      token,
      projectId,
      accountId,
      modelId,
      modelCardId,
      sendObject,
      message
    } = eventPayload
    this.emit('senderProgress', {
      id: modelCardId,
      status: 'Uploading',
      progress: 0
    } as unknown as string)
    // TODO: More of a question: why are we not sending multiple batches at once?
    // What's in a batch? etc. To look at optmizing this and not blocking the
    // main thread.
    const promises = [] as Promise<Response>[]
    sendObject.batches.forEach((batch) => {
      const formData = new FormData()
      formData.append(`batch-1`, new Blob([batch], { type: 'application/json' }))
      promises.push(
        fetch(`${serverUrl}/objects/${projectId}`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: formData
        })
      )
    })
    await Promise.all(promises)

    const args: CreateVersionArgs = {
      projectId,
      modelId,
      accountId,
      objectId: sendObject.id,
      sourceApplication: 'sketchup',
      message: message || 'send from sketchup'
    }
    this.emit('createVersion', args as unknown as string)

    this.emit('senderProgress', {
      id: modelCardId,
      status: 'Completed',
      progress: 1
    } as unknown as string)
  }

  public async create(): Promise<boolean> {
    // Initialization continues in the receiveCommandsAndInitializeBridge function,
    // where we expect sketchup to return to us the command names for related bindings/views.
    sketchup.getCommands(this.bindingName)

    //
    try {
      await this.isInitalized
      return true
    } catch {
      return false
    }
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

    this.resolveIsInitializedPromise(true)
  }

  /**
   * Will be called by `executeScript('bindings.rejectBindings()')` from sketchup.
   * @param message
   */
  private rejectBindings(message: string) {
    this.rejectIsInitializedPromise(message)
  }

  /**
   * Internal calls to Sketchup.
   * @param methodName
   * @param args
   */
  private async runMethod(methodName: string, args: unknown[]): Promise<unknown> {
    const requestId = uniqueId(this.bindingName)

    // TODO: more on the ruby end, but for now Oguzhan seems happy with this.
    // Changes might be needed in the future.
    sketchup.exec({
      name: methodName,
      // eslint-disable-next-line camelcase
      request_id: requestId,
      // eslint-disable-next-line camelcase
      binding_name: this.bindingName,
      data: { args }
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

  private receiveResponse(requestId: string, data: object) {
    if (!this.requests[requestId])
      throw new Error(
        `Sketchup Bridge found no request to resolve with the id of ${requestId}. Something is weird!`
      )
    const request = this.requests[requestId]
    try {
      // eslint-disable-next-line no-prototype-builtins
      if (data && data.hasOwnProperty('error')) {
        console.error(data)
        throw new Error(
          `Failed to run ${requestId}. The host app error is logged above.`
        )
      }

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

  public showDevTools() {
    // eslint-disable-next-line no-alert
    window.alert(
      'Sketchup cannot do this. The dev tools menu is accessible via a right click.'
    )
  }
}
