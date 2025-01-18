import type { ConversionResult } from 'lib/conversions/conversionResult'
import type { IModelCardSharedEvents } from '~/lib/models/card'
import type { CardSetting } from '~/lib/models/card/setting'
import type {
  IBinding,
  IBindingSharedEvents
} from '~~/lib/bindings/definitions/IBinding'

export const IReceiveBindingKey = 'receiveBinding'

export interface IReceiveBinding extends IBinding<IReceiveBindingEvents> {
  receive: (modelCardId: string) => Promise<void>
  getReceiveSettings: () => Promise<CardSetting[]>
  cancelReceive: (modelId: string) => Promise<void>
}

export interface IReceiveBindingEvents
  extends IBindingSharedEvents,
    IModelCardSharedEvents {
  // See note oon timeout in bridge v2; we might not need this
  setModelReceiveResult: (args: {
    modelCardId: string
    bakedObjectIds: Record<string, string>
    conversionResults: ConversionResult[]
  }) => void
}
