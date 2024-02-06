import { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { IModelCard, ModelCard } from '~~/lib/models/card'

export interface ISenderModelCard extends IModelCard {
  sendFilter?: ISendFilter
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

export class SenderModelCard extends ModelCard implements ISenderModelCard {
  sendFilter?: ISendFilter | undefined
  sending?: boolean | undefined

  constructor() {
    super('SenderModelCard')
  }
}
