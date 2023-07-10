// TODO
import { rejects } from 'assert'
import { uniqueId } from 'lodash-es'
import { resolve } from 'path'

declare let sketchup: {
  exec: (data: Record<string, unknown>) => void
}

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
  private isInitializedResolved!: () => unknown

  constructor(bindingsName: string) {
    // window.sketchup
    this.bindingsName = bindingsName || 'default_bindings'

    sketchup.exec({ name: 'get_commands' })
    // Initialization continues in the receiveCommandsAndInitializeBridge function

    this.isInitalized = new Promise((resolve, reject) => {
      // TODO
      this.isInitializedResolved = resolve
    })
  }

  // executeScript(...) from skp
  private receiveCommandsAndInitializeBridge(commandNames: string[]) {
    const hoistTarget = this as unknown as Record<string, unknown>

    for (const commandName of commandNames) {
      hoistTarget[commandName] = (...args: unknown[]) =>
        this.runMethod(commandName, args)
    }

    // this.isInitalized = true
    this.isInitializedResolved()
  }

  private async runMethod(methodName: string, args: unknown[]): Promise<unknown> {
    const requestId = uniqueId(this.bindingsName)

    // The single exec way
    sketchup.exec({ name: methodName, requestId, args })

    return new Promise((resolve, reject) => {
      this.requests[requestId] = {
        resolve,
        reject,
        rejectTimerId: window.setTimeout(() => {
          reject(
            'Sketchup response timed out - did not receive anything back in good time.'
          )
          // TODO: clear request from requests object
        }, this.TIMEOUT_MS)
      }
    })
  }

  private receiveResponse(requestId: string, data: string) {
    // TODO
    if (!this.requests[requestId]) return // throw new error?
    const request = this.requests[requestId]
    try {
      // TODO: resolve also if data is null, it means it's a
      // 'void' function call (does not return anything)
      const parsedData = JSON.parse(data) as Record<string, unknown>
      request.resolve(parsedData)
    } catch (e) {
      request.reject(e as Error)
    } finally {
      window.clearTimeout(request.rejectTimerId)
      delete this.requests[requestId]
    }
  }
}
