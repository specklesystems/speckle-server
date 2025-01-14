import {
  CreateWorkspaceJoinRequest,
  UpdateWorkspaceJoinRequestStatus
} from '@/modules/workspaces/domain/operations'
import { WorkspaceJoinRequest } from '@/modules/workspacesCore/domain/types'
import { WorkspaceJoinRequests } from '@/modules/workspacesCore/helpers/db'
import { Knex } from 'knex'

const tables = {
  workspaceJoinRequests: (db: Knex) =>
    db<WorkspaceJoinRequest>(WorkspaceJoinRequests.name)
}

export const createWorkspaceJoinRequestFactory =
  ({ db }: { db: Knex }): CreateWorkspaceJoinRequest =>
  async ({ workspaceJoinRequest }) => {
    const res = await tables.workspaceJoinRequests(db).insert(workspaceJoinRequest, '*')
    return res[0]
  }

export const updateWorkspaceJoinRequestStatusFactory =
  ({ db }: { db: Knex }): UpdateWorkspaceJoinRequestStatus =>
  async ({ workspaceId, userId, status }) => {
    return await tables
      .workspaceJoinRequests(db)
      .insert({ workspaceId, userId, status })
      .onConflict(['workspaceId', 'userId'])
      .merge(['status'])
  }
