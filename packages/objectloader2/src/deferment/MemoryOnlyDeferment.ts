import { Base } from '../types/types.js'
import { Deferment } from './defermentManager.js'

export class MemoryOnlyDeferment implements Deferment {
  private items: Map<string, Base>

  constructor(items: Map<string, Base>) {
    this.items = items
  }
  defer(params: { id: string }): [Promise<Base>, boolean] {
    const item = this.items.get(params.id)
    if (item) {
      return [Promise.resolve(item), true]
    }
    return [Promise.reject(new Error('Not found in cache: ' + params.id)), false]
  }
  undefer(): void {
    //no-op
  }
  dispose(): void {
    //no-op
  }
}
