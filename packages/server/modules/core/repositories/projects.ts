import { StreamAcl, Streams } from '@/modules/core/dbSchema'
import {
  DeleteProject,
  GetProject,
  StoreProject,
  StoreProjectRole
} from '@/modules/core/domain/projects/operations'
import { Project } from '@/modules/core/domain/streams/types'
import { StreamAclRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'

const tables = {
  projects: (db: Knex) => db<Project>(Streams.name),
  projectAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name)
}

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
  async ({ projectId, userId, role }) => {
    await tables.projectAcl(db).insert({ resourceId: projectId, role, userId })
  }
