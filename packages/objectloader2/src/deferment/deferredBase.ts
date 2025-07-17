import { Base } from '../types/types.js'

export class DeferredBase {
  private promise: Promise<Base>
  private resolve!: (value: Base) => void
  private reject!: (reason?: Error) => void
  private base?: Base
  private size?: number

  private readonly id: string

  constructor(id: string) {
    this.id = id
    this.promise = new Promise<Base>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  getId(): string {
    return this.id
  }

  getBase(): Base | undefined {
    return this.base
  }
  getSize(): number | undefined {
    return this.size
  }

  getPromise(): Promise<Base> {
    return this.promise
  }


  found(value: Base, size: number): void {
    this.base = value
    this.size = size
    this.resolve(value)
  }
}
