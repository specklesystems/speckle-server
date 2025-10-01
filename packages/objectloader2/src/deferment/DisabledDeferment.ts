import { Base } from '../types/types.js'
import { Deferment } from './defermentManager.js'

export class DisabledDeferment implements Deferment {
  defer(params: { id: string }): [Promise<Base>, boolean] {
    return [Promise.reject(new Error('Deferment is disabled: ' + params.id)), false]
  }
  undefer(): void {
    //no-op
  }
  dispose(): void {
    //no-op
  }
}
