export default class KeyedQueue<K, V> {
  private _map: Map<K, V>
  private _order: K[]

  constructor() {
    this._map = new Map<K, V>()
    this._order = []
  }

  enqueue(key: K, value: V): boolean {
    if (this._map.has(key)) {
      return false // Key already exists
    }
    this._map.set(key, value)
    this._order.push(key)
    return true
  }

  enqueueAll(keys: K[], values: V[]): number {
    let count = 0
    for (let i = 0; i < keys.length; i++) {
      if (!this._map.has(keys[i])) {
        this._map.set(keys[i], values[i])
        this._order.push(keys[i])
        count++
      }
    }
    return count
  }

  get(key: K): V | undefined {
    return this._map.get(key)
  }

  has(key: K): boolean {
    return this._map.has(key)
  }

  get size(): number {
    return this._order.length
  }

  spliceValues(start: number, deleteCount: number): V[] {
    const splicedKeys = this._order.splice(start, deleteCount)
    const result: V[] = []

    for (const key of splicedKeys) {
      const value = this._map.get(key)
      if (value !== undefined) {
        result.push(value)
        this._map.delete(key)
      }
    }

    return result
  }
}
