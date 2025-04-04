import { StreamAcl, Users } from '@/modules/core/dbSchema'
import { StreamAclRecord } from '@/modules/core/helpers/types'
import { UserRecord } from '@/modules/core/helpers/userHelper'
import { IntersectProjectCollaboratorsAndWorkspaceCollaborators } from '@/modules/workspaces/domain/operations'
import { WorkspaceAcl } from '@/modules/workspacesCore/helpers/db'
import { Knex } from 'knex'

const tables = {
  streamAcl: (db: Knex) => db.table<StreamAclRecord>('stream_acl')
}

export const intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory =
  (deps: { db: Knex }): IntersectProjectCollaboratorsAndWorkspaceCollaborators =>
  async ({ projectId, workspaceId }) => {
    return await tables
      .streamAcl(deps.db)
      .select<UserRecord[]>(...Users.cols, ...StreamAcl.cols, ...WorkspaceAcl.cols)
      .join(Users.name, Users.col.id, StreamAcl.col.userId)
      .leftJoin(WorkspaceAcl.name, WorkspaceAcl.col.userId, StreamAcl.col.userId)
      .where(StreamAcl.col.resourceId, projectId)
      .where(WorkspaceAcl.col.workspaceId, workspaceId)
      .whereNull(WorkspaceAcl.col.role)
      .distinctOn(Users.col.id)
  }
