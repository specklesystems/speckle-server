import { ReceiveConversionResult } from '~/lib/conversions/receiveConversionResult'
import { IModelCard, ModelCard } from '~~/lib/models/card'

export interface IReceiverModelCard extends IModelCard {
  projectName: string
  modelName: string
  selectedVersionId: string
  latestVersionId?: string
  hasDismissedUpdateWarning: boolean
  /** Keeps track whether the user intentionally selected an older version to receive when creating the model card. */
  hasSelectedOldVersion: boolean
  receiveResult?: {
    receiveConversionResults: ReceiveConversionResult[]
    display: boolean
  }
}

export class ReceiverModelCard extends ModelCard implements IReceiverModelCard {
  projectName!: string
  modelName!: string
  selectedVersionId!: string
  latestVersionId!: string
  hasDismissedUpdateWarning!: boolean
  hasSelectedOldVersion!: boolean
  constructor() {
    super('ReceiverModelCard')
  }
}
