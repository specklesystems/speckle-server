import { IModelCard } from 'lib/bindings/definitions/IBasicConnectorBinding'
import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const ISendBindingKey = 'sendBinding'

export interface ISendBinding extends IBinding<ISendBindingEvents> {
  getSendFilters: () => Promise<ISendFilter[]>
  send: (modelCardId: string) => Promise<void>
}

export interface ISendBindingEvents {
  filtersNeedRefresh: () => void
  sendersExpired: (args: string[]) => void
  senderProgress: (args: SenderProgressArgs) => void
  createVersion: (args: CreateVersionArgs) => void
}

export type SenderProgressArgs = {
  id: string
  status?: string
  progress?: number
}

export type CreateVersionArgs = {
  projectId: string
  modelId: string
  accountId: string
  objectId: string
  message?: string
}

export interface ISendFilter extends IDiscriminatedObject {
  name: string
  summary: string
}

export interface IDirectSelectionSendFilter extends ISendFilter {
  selectedObjectIds: string[]
}
