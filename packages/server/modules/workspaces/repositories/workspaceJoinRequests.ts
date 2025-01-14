import { UpdateWorkspaceJoinRequestStatus } from '@/modules/workspaces/domain/operations'
import { WorkspaceJoinRequest } from '@/modules/workspacesCore/domain/types'
import { WorkspaceJoinRequests } from '@/modules/workspacesCore/helpers/db'
import { Knex } from 'knex'

const tables = {
  workspaceJoinRequests: (db: Knex) =>
    db<WorkspaceJoinRequest>(WorkspaceJoinRequests.name)
}

export const updateWorkspaceJoinRequestStatusFactory =
  ({ db }: { db: Knex }): UpdateWorkspaceJoinRequestStatus =>
  async ({ workspaceId, userId, status }) => {
    const [request] = await tables
      .workspaceJoinRequests(db)
      .insert({ workspaceId, userId, status })
      .onConflict(['workspaceId', 'userId'])
      .merge(['status'])
      .returning('*')
    return request
  }
