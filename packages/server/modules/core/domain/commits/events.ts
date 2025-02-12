import { Version } from '@/modules/core/domain/commits/types'

export const versionEventsNamespace = 'versions' as const

export const VersionEvents = {
  Created: `${versionEventsNamespace}.created`
} as const

export type VersionEventsPayloads = {
  [VersionEvents.Created]: { projectId: string; modelId: string; version: Version }
}
