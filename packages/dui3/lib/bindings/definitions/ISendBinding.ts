import { IModelCard } from 'lib/bindings/definitions/IBasicConnectorBinding'
import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const ISendBindingKey = 'sendBinding'

export interface ISendBinding extends IBinding<ISendBindingEvents> {
  getSendFilters: () => Promise<ISendFilter[]>
  send: (modelId: string) => Promise<void>
  cancelSend: (modelId: string) => Promise<void>
}

export interface ISendBindingEvents {
  filtersNeedRefresh: () => void
  sendersExpired: (args: string[]) => void
  senderProgress: (args: SenderProgressArgs) => void
  createVersion: (args: CreateVersionArgs) => void
}

export interface ISenderModelCard extends IModelCard {
  typeDiscriminator: 'SenderModelCard'
  sendFilter: ISendFilter
  expired?: boolean
  sending?: boolean
  progress?: SenderProgressArgs
}

export type SenderProgressArgs = {
  id: string
  status?: string
  progress?: number
}

export type CreateVersionArgs = {
  accountId: string
  projectId: string
  modelCardId: string
  objectId: string
}

export interface ISendFilter extends IDiscriminatedObject {
  name: string
  summary: string
}

export interface IDirectSelectionSendFilter extends ISendFilter {
  selectedObjectIds: string[]
}
