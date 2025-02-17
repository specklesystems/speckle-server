import { Version } from '@/modules/core/domain/commits/types'
import {
  CommitCreateInput,
  CommitUpdateInput,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { MaybeNullOrUndefined } from '@speckle/shared'

export const versionEventsNamespace = 'versions' as const

export const VersionEvents = {
  Created: `${versionEventsNamespace}.created`,
  Updated: `${versionEventsNamespace}.updated`,
  MovedModel: `${versionEventsNamespace}.movedModel`,
  Deleted: `${versionEventsNamespace}.deleted`,
  Received: `${versionEventsNamespace}.received`
} as const

export type VersionEventsPayloads = {
  [VersionEvents.Created]: {
    projectId: string
    modelId: string
    version: Version
    userId: string
    modelName: string
    input: CommitCreateInput
  }
  [VersionEvents.Updated]: {
    projectId: string
    modelId: string
    versionId: string
    newVersion: Version
    oldVersion: Version
    userId: string
    update: CommitUpdateInput | UpdateVersionInput
  }
  [VersionEvents.MovedModel]: {
    projectId: string
    versionId: string
    userId: string
    version: Version
    originalModelId: string
    newModelId: string
  }
  [VersionEvents.Deleted]: {
    projectId: string
    versionId: string
    modelId: string
    userId: string
    version: Version
  }
  [VersionEvents.Received]: {
    projectId: string
    versionId: string
    userId: string
    sourceApplication: string
    message: MaybeNullOrUndefined<string>
  }
}
