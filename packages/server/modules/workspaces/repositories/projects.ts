import { StreamAcl, Streams, Users } from '@/modules/core/dbSchema'
import type { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import type { UserRecord } from '@/modules/core/helpers/userHelper'
import type {
  GetProjectWorkspace,
  IntersectProjectCollaboratorsAndWorkspaceCollaborators
} from '@/modules/workspaces/domain/operations'
import type { Workspace } from '@/modules/workspacesCore/domain/types'
import { WorkspaceAcl, Workspaces } from '@/modules/workspacesCore/helpers/db'
import type { Knex } from 'knex'

const tables = {
  streamAcl: (db: Knex) => db.table<StreamAclRecord>(StreamAcl.name),
  workspaces: (db: Knex) => db.table<Workspace>(Workspaces.name),
  streams: (db: Knex) => db.table<StreamRecord>(Streams.name)
}

export const intersectProjectCollaboratorsAndWorkspaceCollaboratorsFactory =
  (deps: { db: Knex }): IntersectProjectCollaboratorsAndWorkspaceCollaborators =>
  async ({ projectId, workspaceId }) => {
    return await tables
      .streamAcl(deps.db)
      .select<UserRecord[]>(...Users.cols)
      .join(Users.name, Users.col.id, StreamAcl.col.userId)
      .where(StreamAcl.col.resourceId, projectId)
      .except((builder) => {
        return builder
          .select(...Users.cols)
          .from(WorkspaceAcl.name)
          .join(Users.name, Users.col.id, WorkspaceAcl.col.userId)
          .where(WorkspaceAcl.col.workspaceId, workspaceId)
      })
  }

export const getProjectWorkspaceFactory =
  (deps: { db: Knex }): GetProjectWorkspace =>
  async ({ projectId }) => {
    const q = tables
      .streams(deps.db)
      .select<Workspace[]>(Workspaces.cols)
      .innerJoin(Workspaces.name, Workspaces.col.id, Streams.col.workspaceId)
      .where(Streams.col.id, projectId)
      .andWhere((w) => w.whereNotNull(Workspaces.col.id))

    const ret = await q.first()
    return ret || null
  }
