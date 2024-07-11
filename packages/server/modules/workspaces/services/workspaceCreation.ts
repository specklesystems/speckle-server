import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import {
  EmitWorkspaceEvent,
  StoreBlob,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'

type WorkspaceCreateArgs = {
  workspaceInput: { name: string; description: string | null; logo: string | null }
  userId: string
}

export const createWorkspaceFactory =
  ({
    upsertWorkspace,
    upsertWorkspaceRole,
    emitWorkspaceEvent,
    storeBlob
  }: {
    upsertWorkspace: UpsertWorkspace
    upsertWorkspaceRole: UpsertWorkspaceRole
    storeBlob: StoreBlob
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({ userId, workspaceInput }: WorkspaceCreateArgs): Promise<Workspace> => {
    let logoUrl: string | null = null
    if (workspaceInput.logo) {
      logoUrl = await storeBlob(workspaceInput.logo)
    }

    const workspace = {
      ...workspaceInput,
      id: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      logoUrl
    }
    await upsertWorkspace({ workspace })
    // assign the creator as workspace administrator
    await upsertWorkspaceRole({
      userId,
      role: Roles.Workspace.Admin,
      workspaceId: workspace.id
    })

    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Created,
      payload: { ...workspace, createdByUserId: userId }
    })
    // emit a workspace created event

    return workspace
  }
