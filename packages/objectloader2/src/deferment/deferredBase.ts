import { Base } from '../types/types.js'

export class DeferredBase {
  private promise: Promise<Base>
  private resolve!: (value: Base) => void
  private reject!: (reason?: Error) => void
  private base?: Base
  private size?: number

  private readonly id: string
  private expiresAt: number // Timestamp in ms
  private ttl: number // ttl in ms

  constructor(ttl: number, id: string, expiresAt: number) {
    this.expiresAt = expiresAt
    this.ttl = ttl
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

  isExpired(now: number): boolean {
    return this.base !== undefined && now > this.expiresAt
  }
  setAccess(now: number): void {
    this.expiresAt = now + this.ttl
  }

  found(value: Base, size?: number): void {
    this.base = value
    this.size = size
    this.resolve(value)
  }
  done(now: number): boolean {
    if (this.base) {
      this.resolve(this.base)
    }
    if (this.isExpired(now)) {
      return true
    }
    return false
  }
}
