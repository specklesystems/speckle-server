import { StreamAcl, Streams } from '@/modules/core/dbSchema'
import type {
  DeleteProject,
  GetProject,
  GetUserProjectRoles,
  StoreProject,
  StoreProjectRole,
  StoreProjectRoles
} from '@/modules/core/domain/projects/operations'
import type { Project } from '@/modules/core/domain/streams/types'
import type { StreamAclRecord } from '@/modules/core/helpers/types'
import type { Knex } from 'knex'

const tables = {
  projects: (db: Knex) => db<Project>(Streams.name),
  projectAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name)
}

// TODO: here!
export const storeProjectFactory =
  ({ db }: { db: Knex }): StoreProject =>
  async ({ project }) => {
    await tables.projects(db).insert(project)
  }

export const getProjectFactory =
  ({ db }: { db: Knex }): GetProject =>
  async ({ projectId }) => {
    const project = await tables.projects(db).select().where({ id: projectId }).first()
    return project || null
  }

export const deleteProjectFactory =
  ({ db }: { db: Knex }): DeleteProject =>
  async ({ projectId }) => {
    await tables.projects(db).where({ id: projectId }).delete()
  }

export const storeProjectRoleFactory =
  ({ db }: { db: Knex }): StoreProjectRole =>
  async (role) => {
    await storeProjectRolesFactory({ db })({ roles: [role] })
  }

export const storeProjectRolesFactory =
  ({ db }: { db: Knex }): StoreProjectRoles =>
  async ({ roles }) => {
    await tables.projectAcl(db).insert(
      roles.map((role) => ({
        resourceId: role.projectId,
        userId: role.userId,
        role: role.role
      }))
    )
  }

export const getUserProjectRolesFactory =
  ({ db }: { db: Knex }): GetUserProjectRoles =>
  async ({ userId, workspaceId }) => {
    const query = db<StreamAclRecord>(StreamAcl.name).where({ userId })

    if (workspaceId) {
      query
        .join(Streams.name, Streams.col.id, StreamAcl.col.resourceId)
        .where({ workspaceId })
    }

    return await query
  }
