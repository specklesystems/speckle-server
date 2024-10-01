import { BranchRecord } from '@/modules/core/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum ModelEvents {
  Deleted = 'created'
}

export type ModelEventsPayloads = {
  [ModelEvents.Deleted]: { projectId: string; modelId: string; model: BranchRecord }
}

const { emit, listen } = initializeModuleEventEmitter<ModelEventsPayloads>({
  moduleName: 'core',
  namespace: 'users'
})

export const ModelsEmitter = { emit, listen, events: ModelEvents }
export type ModelsEventsEmitter = (typeof ModelsEmitter)['emit']
