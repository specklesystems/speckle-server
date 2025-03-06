import { Project } from '@/modules/core/domain/streams/types'
import {
  ProjectCreateInput,
  ProjectUpdateInput,
  StreamCreateInput,
  StreamUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { StreamRoles } from '@speckle/shared'

export const projectEventsNamespace = 'projects' as const

export const ProjectEvents = {
  Created: `${projectEventsNamespace}.created`,
  Updated: `${projectEventsNamespace}.updated`,
  Deleted: `${projectEventsNamespace}.deleted`,
  Cloned: `${projectEventsNamespace}.cloned`,
  PermissionsBeingAdded: `${projectEventsNamespace}.permissionsBeingAdded`,
  PermissionsAdded: `${projectEventsNamespace}.permissionsAdded`,
  PermissionsRevoked: `${projectEventsNamespace}.permissionsRevoked`
} as const

export type ProjectEventsPayloads = {
  [ProjectEvents.Created]: {
    project: Project
    ownerId: string
    input: StreamCreateInput | ProjectCreateInput
  }
  [ProjectEvents.Updated]: {
    updaterId: string
    oldProject: Project
    newProject: Project
    update: ProjectUpdateInput | StreamUpdateInput
  }
  [ProjectEvents.Deleted]: {
    deleterId: string
    project: Project
    projectId: string
  }
  [ProjectEvents.Cloned]: {
    clonerId: string
    sourceProject: Project
    newProject: Project
  }
  [ProjectEvents.PermissionsBeingAdded]: {
    activityUserId: string
    targetUserId: string
    role: StreamRoles
    projectId: string
  }
  [ProjectEvents.PermissionsAdded]: {
    activityUserId: string
    targetUserId: string
    role: StreamRoles
    project: Project
  }
  [ProjectEvents.PermissionsRevoked]: {
    activityUserId: string
    removedUserId: string
    project: Project
  }
}
