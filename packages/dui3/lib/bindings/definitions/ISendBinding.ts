import type { ISendFilter } from '~~/lib/models/card/send'
import type {
  IBinding,
  IBindingSharedEvents
} from '~~/lib/bindings/definitions/IBinding'
import type { CardSetting } from '~/lib/models/card/setting'
import type { IModelCardSharedEvents } from '~/lib/models/card'
import type { ConversionResult } from 'lib/conversions/conversionResult'
import type { CreateVersionArgs } from '~/lib/bridge/server'

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
  setIdMap: (args: {
    modelCardId: string
    idMap: Record<string, string>
    newSelectedObjectIds: string[]
  }) => void
  /**
   * Use whenever want to cancel model card progress, it is used on Archicad so far since send operation blocks the UI thread.
   */
  triggerCancel: (modelCardId: string) => void
  triggerCreateVersion: (args: CreateVersionArgs) => void
}
