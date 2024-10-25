import type { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import type { IModelCard } from '~~/lib/models/card'
import { ModelCard } from '~~/lib/models/card'

export interface ISenderModelCard extends IModelCard {
  sendFilter?: ISendFilter
  sending?: boolean
  latestCreatedVersionId?: string
}

export interface ISendFilter extends IDiscriminatedObject {
  id: string
  name: string
  summary: string
  isDefault: boolean
  expired?: boolean
}

export interface IDirectSelectionSendFilter extends ISendFilter {
  selectedObjectIds: string[]
}

export interface RevitViewsSendFilter extends ISendFilter {
  selectedView: string
  availableViews: string[]
}

export interface RevitSelectionSendFilter extends ISendFilter {
  selectedViewIds: string[]
}

export class SenderModelCard extends ModelCard implements ISenderModelCard {
  sendFilter?: ISendFilter | undefined
  sending?: boolean | undefined

  constructor() {
    super('SenderModelCard')
  }
}
