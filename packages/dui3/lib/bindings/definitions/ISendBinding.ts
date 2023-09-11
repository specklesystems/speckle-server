import { IModelCard, ToastInfo } from 'lib/bindings/definitions/IBasicConnectorBinding'
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
  notify: (args: ToastInfo) => void
  createVersion: (args: CreateVersionArgs) => void
}

export interface ISenderModelCard extends IModelCard {
  typeDiscriminator: 'SenderModelCard'
  sendFilter: ISendFilter
  sending?: boolean
  progress?: SenderProgressArgs
  notification?: ToastInfo
}

export type SenderProgressArgs = {
  id: string
  status?: string
  progress?: number
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

export interface ISendFilter extends IDiscriminatedObject {
  name: string
  summary: string
}

export interface IDirectSelectionSendFilter extends ISendFilter {
  selectedObjectIds: string[]
}
