import { Base, Item } from '../types/types.js'

export class DeferredBase {
  private promise: Promise<Base>
  private resolve!: (value: Base) => void
  private reject!: (reason?: Error) => void
  private item?: Item

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

  getItem(): Item | undefined {
    return this.item
  }

  getPromise(): Promise<Base> {
    return this.promise
  }

  isExpired(now: number): boolean {
    return this.item !== undefined && now > this.expiresAt
  }
  setAccess(now: number): void {
    this.expiresAt = now + this.ttl
  }

  found(value: Item): void {
    this.item = value
    this.resolve(value.base)
  }
  done(now: number): boolean {
    if (this.item) {
      this.resolve(this.item.base)
    }
    if (this.isExpired(now)) {
      return true
    }
    return false
  }
}
