import { IModelCard, ModelCard } from '~~/lib/models/card'

export interface IReceiverModelCard extends IModelCard {
  projectName: string
  modelName: string
  selectedVersionId: string
  latestVersionId?: string
  hasDismissedUpdateWarning: boolean
  receiveResult?: { bakedObjectIds: string[]; display: boolean }
}

export class ReceiverModelCard extends ModelCard implements IReceiverModelCard {
  projectName!: string
  modelName!: string
  selectedVersionId!: string
  latestVersionId!: string
  hasDismissedUpdateWarning!: boolean
  constructor() {
    super('ReceiverModelCard')
  }
}
