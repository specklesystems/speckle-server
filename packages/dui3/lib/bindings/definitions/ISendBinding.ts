import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { IBinding } from '~~/lib/bindings/definitions/IBinding'

export const ISendBindingKey = 'sendBinding'

export interface ISendBinding extends IBinding<ISendBindingEvents> {
  getSendFilters: () => Promise<ISendFilter[]>
}

export interface ISendBindingEvents {
  filtersNeedRefresh: () => void
  sendersExpired: (args: SenderExpiredArgs[]) => void
  senderProgress: (args: SenderProgressArgs) => void
}

export type SenderExpiredArgs = {
  id: string
  reason?: string
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
