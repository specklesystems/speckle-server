import { IModelCard } from 'lib/bindings/definitions/IBasicConnectorBinding'
import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const ISendBindingKey = 'sendBinding'

export interface ISendBinding extends IBinding<ISendBindingEvents> {
  getSendFilters: () => Promise<ISendFilter[]>
  send: (args: IModelCard) => Promise<void>
}

export interface ISendBindingEvents {
  filtersNeedRefresh: () => void
  sendersExpired: (args: string[]) => void
  senderProgress: (args: SenderProgressArgs) => void
  sendViaBrowser: (args: SendViaBrowserArgs) => void
}

export type SendViaBrowserArgs = {
  modelCard: IModelCard
  sendObject: SendObject
}

export type SendObject = {
  id: string
  totalChildrenCount: number
  batches: string[]
}

export type SenderProgressArgs = {
  id: string
  status?: string
  progress?: number
}

export interface ISendFilter extends IDiscriminatedObject {
  name: string
  summary: string
}

export interface IDirectSelectionSendFilter extends ISendFilter {
  selectedObjectIds: string[]
}
