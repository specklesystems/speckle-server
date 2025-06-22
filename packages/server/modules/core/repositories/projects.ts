import { MainDb } from '@/db/types'
import { StreamAcl, Streams } from '@/modules/core/dbSchema'
import type {
  DeleteProject,
  GetProject,
  StoreProject,
  StoreProjectRole
} from '@/modules/core/domain/projects/operations'
import type { Project } from '@/modules/core/domain/streams/types'
import type { StreamAclRecord } from '@/modules/core/helpers/types'
import type { ProjectDb } from '@/modules/multiregion/domain/types'
import type { Knex } from 'knex'

const tables = {
  projects: (db: Knex) => db<Project>(Streams.name),
  // ACL is handled in the main DB
  projectAcl: (db: MainDb) => db<StreamAclRecord>(StreamAcl.name)
}

export const storeProjectFactory =
  ({ db }: { db: ProjectDb }): StoreProject =>
  async ({ project }) => {
    await tables.projects(db).insert(project)
  }

// All regions are synced to the main db, so we use the mainDb to find any project regardless of where it is stored
export const getProjectFactory =
  ({ db }: { db: MainDb }): GetProject =>
  async ({ projectId }) => {
    const project = await tables.projects(db).select().where({ id: projectId }).first()
    return project || null
  }

export const deleteProjectFactory =
  ({ db }: { db: ProjectDb }): DeleteProject =>
  async ({ projectId }) => {
    await tables.projects(db).where({ id: projectId }).delete()
  }

export const storeProjectRoleFactory =
  ({ db }: { db: MainDb }): StoreProjectRole =>
  async ({ projectId, userId, role }) => {
    await tables.projectAcl(db).insert({ resourceId: projectId, role, userId })
  }
