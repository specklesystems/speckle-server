import type { IModelCard } from '~~/lib/models/card'
import { ModelCard } from '~~/lib/models/card'

export interface IReceiverModelCard extends IModelCard {
  projectName: string
  modelName: string
  selectedVersionId: string
  selectedVersionSourceApp: string
  selectedVersionUserId: string
  latestVersionId?: string
  latestVersionSourceApp?: string
  latestVersionUserId?: string
  latestVersionCreatedAt?: string
  hasDismissedUpdateWarning: boolean
  /** Keeps track whether the user intentionally selected an older version to receive when creating the model card. */
  hasSelectedOldVersion: boolean
  bakedObjectIds?: Record<string, string>
  displayReceiveComplete: boolean
}

export class ReceiverModelCard extends ModelCard implements IReceiverModelCard {
  projectName!: string
  modelName!: string
  selectedVersionId!: string
  selectedVersionSourceApp!: string
  selectedVersionUserId!: string
  latestVersionId!: string
  latestVersionSourceApp!: string
  latestVersionUserId!: string
  hasDismissedUpdateWarning!: boolean
  hasSelectedOldVersion!: boolean
  displayReceiveComplete!: boolean
  constructor() {
    super('ReceiverModelCard')
    this.displayReceiveComplete = false
  }
}
