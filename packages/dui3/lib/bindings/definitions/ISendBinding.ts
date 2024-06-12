import { ISendFilter } from '~~/lib/models/card/send'
import { IBinding, IBindingSharedEvents } from '~~/lib/bindings/definitions/IBinding'
import { BaseBridge } from '~~/lib/bridge/base'
import { CardSetting } from '~/lib/models/card/setting'
import { IModelCardSharedEvents } from '~/lib/models/card'
import { ConversionResult } from 'lib/conversions/conversionResult'

export const ISendBindingKey = 'sendBinding'

export interface ISendBinding extends IBinding<ISendBindingEvents> {
  getSendFilters: () => Promise<ISendFilter[]>
  getSendSettings: () => Promise<CardSetting[]>
  send: (modelId: string) => Promise<void>
  cancelSend: (modelId: string) => Promise<void>
}

export interface ISendBindingEvents
  extends IBindingSharedEvents,
    IModelCardSharedEvents {
  refreshSendFilters: () => void
  setModelsExpired: (modelCardIds: string[]) => void
  setModelSendResult: (args: {
    modelCardId: string
    versionId: string
    sendConversionResults: ConversionResult[]
  }) => void
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

  getSendSettings() {
    return [
      {
        id: 'includeAttributes',
        type: 'boolean',
        title: 'Include Attributes',
        value: true,
        typeDiscriminator: 'CardSetting'
      }
    ]
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
