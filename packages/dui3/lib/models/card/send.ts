import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { IModelCard } from '~~/lib/models/card'

export interface ISenderModelCard extends IModelCard {
  typeDiscriminator: 'SenderModelCard'
  sendFilter: ISendFilter
  sending?: boolean
}

export interface ISendFilter extends IDiscriminatedObject {
  name: string
  summary: string
  isDefault: boolean
}

export interface IDirectSelectionSendFilter extends ISendFilter {
  selectedObjectIds: string[]
}
