import { Base } from '../types/types.js'

export class DeferredBase {
  promise: Promise<Base>
  resolve!: (value: Base) => void
  reject!: (reason?: Error) => void
  base?: Base

  readonly id: string
  lastAccess: number // Timestamp in ms

  constructor(id: string, lastAccess: number) {
    this.lastAccess = lastAccess
    this.id = id
    this.promise = new Promise<Base>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  found(value: Base): void {
    this.base = value
    this.resolve(value)
  }
  done(): void {
    if (this.base) {
      this.resolve(this.base)
    }
    this.reject(new Error('Base not found'))
  }
}
