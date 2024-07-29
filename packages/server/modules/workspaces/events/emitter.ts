import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'
import {
  WorkspaceEvents,
  WorkspaceEventsPayloads
} from '@/modules/workspacesCore/domain/events'

const { emit, listen } = initializeModuleEventEmitter<WorkspaceEventsPayloads>({
  moduleName: 'workspaces'
})

export const WorkspacesEmitter = { emit, listen, events: WorkspaceEvents }
