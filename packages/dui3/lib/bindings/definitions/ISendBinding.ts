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

  send(modelId: string) {
    console.log(`Model sent with ${modelId} id.`)
  }

  cancelSend(modelId: string) {
    console.log(`Model send cancelled with ${modelId} id.`)
  }

  getSendFilters() {
    return [
      {
        name: 'Everything',
        summary: 'All supported objects in the file.',
        typeDiscriminator: 'MockEverythingFilter'
      },
      {
        name: 'Selection',
        summary: 'Placeholder summary',
        selectedObjectIds: []
      },
      {
        name: 'Layers',
        summary: 'Placeholder summary',
        showLabel: false,
        multiSelect: true,
        selectedOptions: [],
        options: [
          { id: '1', name: 'Layer 1', typeDiscriminator: 'ListValueItem' },
          { id: '2', name: 'Layer 2', typeDiscriminator: 'ListValueItem' }
        ]
      }
    ]
  }
}
