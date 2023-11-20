import { ModelCardNotification } from 'lib/models/card/notification'
import { ModelCardProgress } from 'lib/models/card/progress'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { BaseBridge } from '~~/lib/bridge/base'

export const IReceiveBindingKey = 'receiveBinding'

export interface IReceiveBinding extends IBinding<IReceiveBindingEvents> {
  receive: (modelId: string, versionId: string) => Promise<void>
  cancelReceive: (modelId: string) => Promise<void>
  invalidate: (modelId: string) => Promise<void>
}

export interface IReceiveBindingEvents {
  receiverProgress: (args: ModelCardProgress) => void
  notify: (args: ModelCardNotification) => void
}

export class MockedReceiveBinding extends BaseBridge {
  constructor() {
    super()
  }
}
