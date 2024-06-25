import {
  EmitWorkspaceEvent,
  StoreWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspaces/domain/types'
import { Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'

// using Pick deliberately here, so if we change the Workspace domain model, we need to
// explicitly handle the changes here too
type WorkspaceCreateArgs = {
  workspaceInput: Pick<Workspace, 'name' | 'logoUrl' | 'description'>
  userId: string
}

export const createWorkspaceFactory =
  ({
    storeWorkspace,
    upsertWorkspaceRole,
    emitWorkspaceEvent
  }: {
    storeWorkspace: StoreWorkspace
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({ userId, workspaceInput }: WorkspaceCreateArgs): Promise<Workspace> => {
    const workspace = {
      ...workspaceInput,
      id: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByUserId: userId
    }
    await storeWorkspace({ workspace })
    // assign the creator as workspace administrator
    await upsertWorkspaceRole({
      userId,
      role: Roles.Workspace.Admin,
      workspaceId: workspace.id
    })

    await emitWorkspaceEvent({ event: 'created', payload: workspace })
    // emit a workspace created event

    return workspace
  }
