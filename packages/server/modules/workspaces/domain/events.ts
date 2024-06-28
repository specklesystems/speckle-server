import { Workspace } from '@/modules/workspaces/domain/types'

export const WorkspaceEvents = {
  Created: 'created'
} as const

export type WorkspaceEvents = (typeof WorkspaceEvents)[keyof typeof WorkspaceEvents]

type WorkspaceCreatedPayload = Workspace & {
  createdByUserId: string
}

export type WorkspaceEventsPayloads = {
  [WorkspaceEvents.Created]: WorkspaceCreatedPayload
}
