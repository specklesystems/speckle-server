import { Project } from '@/modules/core/domain/streams/types'

export const projectEventsNamespace = 'projects' as const

export const ProjectEvents = {
  Created: `${projectEventsNamespace}.created`
} as const

export type ProjectEventsPayloads = {
  [ProjectEvents.Created]: { project: Project; ownerId: string }
}
