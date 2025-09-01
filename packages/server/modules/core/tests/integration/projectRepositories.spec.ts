import { db } from '@/db/knex'
import type { Project } from '@/modules/core/domain/streams/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import {
  deleteProjectFactory,
  getProjectFactory,
  storeProjectFactory,
  storeProjectRoleFactory
} from '@/modules/core/repositories/projects'
import { getUserProjectRolesFactory } from '@/modules/core/repositories/projects'
import { expectToThrow } from '@/test/assertionHelper'
import { createTestUser } from '@/test/authHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { assign } from 'lodash-es'
import type { DeleteProject } from '@/modules/core/domain/projects/operations'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { logger } from '@/observability/logging'
import { getProjectReplicationDbClients } from '@/modules/multiregion/utils/dbSelector'

const createTestProject = (overrides?: Partial<Project>): Project => {
  const defaults: Project = {
    id: cryptoRandomString({ length: 10 }),
    allowPublicComments: false,
    clonedFrom: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: 'a test project',
    visibility: ProjectRecordVisibility.Public,
    name: cryptoRandomString({ length: 10 }),
    regionKey: null,
    workspaceId: null
  }
  return assign(defaults, overrides || {})
}

const storeProject = storeProjectFactory({ db })
const getProject = getProjectFactory({ db })
const deleteProject: DeleteProject = async ({ projectId }) =>
  asMultiregionalOperation(
    async ({ allDbs }) => {
      await replicateFactory(allDbs, deleteProjectFactory)({ projectId })
    },
    {
      name: 'delete spec',
      logger,
      dbs: await getProjectReplicationDbClients({ projectId })
    }
  )
const storeProjectRole = storeProjectRoleFactory({ db })

describe('project repositories @core', () => {
  describe('storeProjectFactory creates a function, that', () => {
    it('stores the project', async () => {
      const project = createTestProject()
      await storeProject({ project })
    })
    it('fails to store project if workspaceId not in db', async () => {
      const project = createTestProject({
        workspaceId: cryptoRandomString({ length: 10 })
      })
      const err = await expectToThrow(async () => {
        await storeProject({ project })
      })
      expect(err.message).to.not.be.null
    })
    it('fails to store project if clonedFrom not in db', async () => {
      const project = createTestProject({
        clonedFrom: cryptoRandomString({ length: 10 })
      })
      const err = await expectToThrow(async () => {
        await storeProject({ project })
      })
      expect(err.message).to.not.be.null
    })
  })
  describe('getProjectFactory creates a function, that', () => {
    it('returns null if project is not found', async () => {
      const project = await getProject({
        projectId: cryptoRandomString({ length: 10 })
      })
      expect(project).to.be.null
    })
    it('returns the stored project', async () => {
      const project = createTestProject()
      await storeProject({ project })

      const storedProject = await getProject({ projectId: project.id })
      expect(project).deep.equal(storedProject)
    })
  })
  describe('deleteProjectFactory creates a function, that', () => {
    it('does nothing if project does not exist', async () => {
      await deleteProject({ projectId: cryptoRandomString({ length: 10 }) })
    })
    it('deletes the project', async () => {
      const project = createTestProject()
      await storeProject({ project })

      const projectId = project.id
      let storedProject = await getProject({ projectId })
      expect(project).deep.equal(storedProject)

      await deleteProject({ projectId })
      storedProject = await getProject({ projectId })
      expect(storedProject).to.be.null
    })
    it.skip('fails if project has versions')
  })
  describe('storeProjectRoleFactory creates a function, that', () => {
    it('stores the projectRole', async () => {
      const project = createTestProject()
      await storeProject({ project })
      const testUser = await createTestUser({})
      const role = {
        projectId: project.id,
        role: Roles.Stream.Owner,
        userId: testUser.id
      }
      await storeProjectRole(role)
      const storedRoles = await getUserProjectRolesFactory({ db })({
        userId: testUser.id
      })
      expect(storedRoles).deep.equalInAnyOrder([
        { resourceId: project.id, role: role.role, userId: role.userId }
      ])
    })
  })
})
