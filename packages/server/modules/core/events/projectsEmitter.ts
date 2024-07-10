import { StreamRecord } from '@/modules/core/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export const ProjectEvents = {
  Created: 'created'
} as const

export type ProjectEvents = (typeof ProjectEvents)[keyof typeof ProjectEvents]

export type ProjectEventsPayloads = {
  [ProjectEvents.Created]: { project: StreamRecord }
}

const { emit, listen } = initializeModuleEventEmitter<ProjectEventsPayloads>({
  moduleName: 'core',
  namespace: 'projects'
})

export const ProjectsEmitter = { emit, listen, events: ProjectEvents }
