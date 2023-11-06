import { ModelCardNotification } from '~~/lib/models/card/notification'
import { ModelCardProgress } from '~~/lib/models/card/progress'
import { ISendFilter } from '~~/lib/models/card/send'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'
import { BaseBridge } from '~~/lib/bridge/base'

export const ISendBindingKey = 'sendBinding'

export interface ISendBinding extends IBinding<ISendBindingEvents> {
  getSendFilters: () => Promise<ISendFilter[]>
  send: (modelId: string) => Promise<void>
  cancelSend: (modelId: string) => Promise<void>
}

export interface ISendBindingEvents {
  filtersNeedRefresh: () => void
  sendersExpired: (args: string[]) => void
  senderProgress: (args: ModelCardProgress) => void
  notify: (args: ModelCardNotification) => void
  createVersion: (args: CreateVersionArgs) => void
}

export type CreateVersionArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  accountId: string
  objectId: string
  message?: string
  sourceApplication?: string
}

export class MockedSendBinding extends BaseBridge {
  constructor() {
    super()
  }

  getSendFilters() {
    return []
  }
}
