import { Model } from '@/modules/core/domain/branches/types'

export const modelEventsNamespace = 'models' as const

export const ModelEvents = {
  Deleted: `${modelEventsNamespace}.deleted`
} as const

export type ModelEventsPayloads = {
  [ModelEvents.Deleted]: { projectId: string; modelId: string; model: Model }
}
