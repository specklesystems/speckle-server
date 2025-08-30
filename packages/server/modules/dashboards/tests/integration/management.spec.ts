import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import {
  getDashboardRecordFactory,
  upsertDashboardFactory
} from '@/modules/dashboards/repositories/management'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import { db } from '@/db/knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'

const getDashboardRecord = getDashboardRecordFactory({ db })
const upsertDashboardRecord = upsertDashboardFactory({ db })

describe('basic dashboard crud', () => {
  const testUser: BasicTestUser = {
    id: '',
    name: 'Stacy Fakename',
    email: createRandomEmail()
  }

  const testWorkspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    slug: '',
    name: 'Dashboard Workspace'
  }

  before(async () => {
    await createTestUser(testUser)
    await createTestWorkspace(testWorkspace, testUser)
  })

  describe('upsertDashboardFactory returns a function, that', async () => {
    it('should correctly upsert empty project id array', async () => {
      const id = cryptoRandomString({ length: 9 })
      await upsertDashboardRecord({
        id,
        name: cryptoRandomString({ length: 9 }),
        workspaceId: testWorkspace.id,
        ownerId: testUser.id,
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const dashboard = await getDashboardRecord({ id })

      expect(dashboard).to.exist
      expect(dashboard?.projectIds.length).to.equal(0)
    })

    it('should correctly upsert project id array of one element', async () => {
      const id = cryptoRandomString({ length: 9 })
      await upsertDashboardRecord({
        id,
        name: cryptoRandomString({ length: 9 }),
        workspaceId: testWorkspace.id,
        ownerId: testUser.id,
        projectIds: ['foo'],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const dashboard = await getDashboardRecord({ id })

      expect(dashboard).to.exist
      expect(dashboard?.projectIds.length).to.equal(1)
      expect(dashboard?.projectIds.at(0)).to.equal('foo')
    })

    it('should correctly upsert project id array of several elements', async () => {
      const id = cryptoRandomString({ length: 9 })
      const projectIds = ['foo', 'bar', 'baz']
      await upsertDashboardRecord({
        id,
        name: cryptoRandomString({ length: 9 }),
        workspaceId: testWorkspace.id,
        ownerId: testUser.id,
        projectIds,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const dashboard = await getDashboardRecord({ id })

      expect(dashboard).to.exist
      expect(dashboard?.projectIds.length).to.equal(3)
      expect(dashboard?.projectIds).to.deep.equalInAnyOrder(projectIds)
    })
  })
})
