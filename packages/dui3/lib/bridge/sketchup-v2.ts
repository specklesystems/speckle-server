import { ServerBridge } from '~/lib/bridge/server'

declare let sketchup: {
  exec: (data: Record<string, unknown>) => void
  getBindingsMethodNames: (bindingName: string) => void
}

export class SketchupBridge extends ServerBridge {
  public isInitalized: Promise<boolean>
  private resolveIsInitializedPromise!: (v: boolean) => unknown
  private rejectIsInitializedPromise!: (message: string) => unknown

  constructor(bindingName: string) {
    super(bindingName)
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

  protected execMethod(methodName: string, requestId: string, args: unknown[]): void {
    sketchup.exec({
      name: methodName,
      // eslint-disable-next-line camelcase
      request_id: requestId,
      // eslint-disable-next-line camelcase
      binding_name: this.bindingName,
      data: { args }
    })
  }

  public async create(): Promise<boolean> {
    // Initialization continues in the receiveCommandsAndInitializeBridge function,
    // where we expect sketchup to return to us the command names for related bindings/views.
    sketchup.getBindingsMethodNames(this.bindingName)

    try {
      await this.isInitalized
      return true
    } catch {
      return false
    }
  }

  /**
   * Will be called by `executeScript('bindings.receiveCommandsAndInitializeBridge()')` from sketchup. This is where the hoisting happens.
   * @param commandNames serialized command names that comes from sketchup binding.
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
}
