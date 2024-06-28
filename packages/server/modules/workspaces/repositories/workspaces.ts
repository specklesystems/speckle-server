import { StoreWorkspace, UpsertWorkspaceRole } from '@/modules/workspaces/domain/operations'
import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { Roles } from '@speckle/shared'
import { Knex } from 'knex'

const tables = {
  workspaces: (db: Knex) => db<Workspace>('workspaces'),
  workspacesAcl: (db: Knex) => db<WorkspaceAcl>('workspace_acl')
}

export const storeWorkspaceFactory =
  ({ db }: { db: Knex }): StoreWorkspace =>
    async ({ workspace }) => {
      await tables.workspaces(db).insert(workspace)
    }

// TODO: Authorise requester for given role change operation?
export const upsertWorkspaceRole =
  ({ db }: { db: Knex }): UpsertWorkspaceRole =>
    async ({ userId, workspaceId, role }) => {
      const validRoles = Object.values(Roles.Workspace)
      if (!validRoles.includes(role)) {
        throw new Error(`Unexpected workspace role provided: ${role}`)
      }

      await tables.workspacesAcl(db).insert({ userId, workspaceId, role })
    }

