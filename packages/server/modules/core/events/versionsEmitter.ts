import { CommitRecord } from '@/modules/core/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum VersionEvents {
  Created = 'created'
}

export type VersionEventsPayloads = {
  [VersionEvents.Created]: { projectId: string; modelId: string; version: CommitRecord }
}

const { emit, listen } = initializeModuleEventEmitter<VersionEventsPayloads>({
  moduleName: 'core',
  namespace: 'users'
})

export const VersionsEmitter = { emit, listen, events: VersionEvents }
export type VersionsEventEmitter = (typeof VersionsEmitter)['emit']
export type VersionsEventListener = (typeof VersionsEmitter)['listen']
