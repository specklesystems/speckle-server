import type { Model } from '@/modules/core/domain/branches/types'
import type {
  BranchDeleteInput,
  BranchUpdateInput,
  DeleteModelInput,
  UpdateModelInput
} from '@/modules/core/graph/generated/graphql'

export const modelEventsNamespace = 'models' as const

export const ModelEvents = {
  Deleted: `${modelEventsNamespace}.deleted`,
  Created: `${modelEventsNamespace}.created`,
  Updated: `${modelEventsNamespace}.updated`
} as const

export type ModelEventsPayloads = {
  [ModelEvents.Deleted]: {
    projectId: string
    modelId: string
    model: Model
    userId: string
    input: BranchDeleteInput | DeleteModelInput
  }
  [ModelEvents.Created]: { projectId: string; model: Model }
  [ModelEvents.Updated]: {
    update: BranchUpdateInput | UpdateModelInput
    userId: string
    oldModel: Model
    newModel: Model
  }
}
