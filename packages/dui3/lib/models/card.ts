import crs from 'crypto-random-string'
import type { AutomationRunItemFragment } from '~/lib/common/generated/gql/graphql'
import type { ConversionResult } from '~/lib/conversions/conversionResult'
import type { CardSetting } from '~/lib/models/card/setting'
import type { IDiscriminatedObject } from '~~/lib/bindings/definitions/common'
import { DiscriminatedObject } from '~~/lib/bindings/definitions/common'

export interface IModelCard extends IDiscriminatedObject {
  modelCardId: string
  modelId: string
  projectId: string
  workspaceId?: string
  accountId: string
  serverUrl: string
  expired: boolean
  progress?: ModelCardProgress
  settings?: CardSetting[]
  error?: { errorMessage: string; dismissible: boolean }
  report?: ConversionResult[]
  automationRuns?: AutomationRunItemFragment[]
}

export class ModelCard extends DiscriminatedObject implements IModelCard {
  modelCardId: string
  modelId!: string
  projectId!: string
  workspaceId?: string
  accountId!: string
  serverUrl!: string
  expired: boolean
  progress: ModelCardProgress | undefined
  settings: CardSetting[] | undefined

  constructor(typeDiscriminator: string) {
    super(typeDiscriminator)
    this.modelCardId = crs({ length: 20 })
    this.expired = false
  }
}

export interface IModelCardSharedEvents {
  setModelError: (args: { modelCardId: string; error: string }) => void
  setModelProgress: (args: {
    modelCardId: string
    progress?: ModelCardProgress
  }) => void
}

export type ModelCardProgress = {
  status: string
  progress?: number
}
