import { ServerAcl } from '@/modules/core/dbSchema'
import type { ServerAclRecord, StreamAclRecord } from '@/modules/core/helpers/types'
import type {
  GetUserAclRole,
  GetUserServerRole
} from '@/modules/shared/domain/operations'
import type { WorkspaceAcl as WorkspaceAclRecord } from '@/modules/workspacesCore/domain/types'
import type { AvailableRoles, Optional, ServerRoles } from '@speckle/shared'
import type { Knex } from 'knex'

const tables = {
  serverAcl: (db: Knex) => db<ServerAclRecord>(ServerAcl.name)
}

export const getUserAclRoleFactory =
  (deps: { db: Knex }): GetUserAclRole =>
  async (params) => {
    const { aclTableName, userId, resourceId } = params
    if (!userId) {
      return null
    }

    const query: { userId: string; resourceId?: string; workspaceId?: string } = {
      userId
    }

    // Different acl tables have different names for the resource id column
    switch (aclTableName) {
      case 'server_acl': {
        // No mutation necessary
        break
      }
      case 'stream_acl': {
        query.resourceId = resourceId
        break
      }
      case 'workspace_acl': {
        query.workspaceId = resourceId
        break
      }
    }

    const ret: Optional<ServerAclRecord | StreamAclRecord | WorkspaceAclRecord> =
      await deps.db(aclTableName).select('*').where(query).first()
    return ret?.role as Optional<AvailableRoles>
  }

export const getUserServerRoleFactory =
  (deps: { db: Knex }): GetUserServerRole =>
  async (params) => {
    const acl = await tables
      .serverAcl(deps.db)
      .where(ServerAcl.col.userId, params.userId)
      .first()
    return acl?.role as Optional<ServerRoles>
  }
