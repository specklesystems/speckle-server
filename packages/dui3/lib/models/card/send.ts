import type { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import type { IModelCard } from '~~/lib/models/card'
import { ModelCard } from '~~/lib/models/card'

export interface ISenderModelCard extends IModelCard {
  sendFilter?: ISendFilter
  sending?: boolean
  latestCreatedVersionId?: string
}

export interface SendFilterObjectIdentifier {
  uniqueId: string
  elementId: string
  categoryId: string
}

export interface ISendFilter extends IDiscriminatedObject {
  id: string
  type: string
  name: string
  summary: string
  isDefault: boolean
  expired?: boolean
  idMap?: Record<string, string>
  selectedObjectIds: string[]
}

export interface IDirectSelectionSendFilter extends ISendFilter {}

export interface RevitViewsSendFilter extends ISendFilter {
  selectedView: string
  availableViews: string[]
}

export type ISendFilterSelectItem = {
  name: string
  id: string
}

export type CategoriesData = {
  name: string
  id: string
}

export interface RevitCategoriesSendFilter extends ISendFilter {
  selectedCategories: string[]
  availableCategories: CategoriesData[]
}

export interface SendFilterSelect extends ISendFilter {
  isMultiSelectable: boolean
  selectedItems: ISendFilterSelectItem[]
  items: ISendFilterSelectItem[]
}

export class SenderModelCard extends ModelCard implements ISenderModelCard {
  sendFilter?: ISendFilter | undefined
  sending?: boolean | undefined

  constructor() {
    super('SenderModelCard')
  }
}
