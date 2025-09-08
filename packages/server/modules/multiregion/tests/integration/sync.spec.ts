import { db } from '@/db/knex'
import {
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  buildBasicTestUser,
  createTestUser,
  type BasicTestUser
} from '@/test/authHelper'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { expect } from 'chai'
import {
  copyAllUsersAcrossRegionsFactory,
  copyAllWorkspacesAcrossRegionsFactory
} from '@/modules/multiregion/tasks/regionSync'
import {
  getAllWorkspaceChecksumFactory,
  getAllWorkspacesFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import type { Knex } from 'knex'
import { logger } from '@/observability/logging'
import {
  getAllUsersChecksumFactory,
  getAllUsersFactory,
  upsertUserFactory
} from '@/modules/core/repositories/users'
import { truncateTables } from '@/test/hooks'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import { Users } from '@/modules/core/dbSchema'

isMultiRegionTestMode()
  ? describe('Testing mechanism to solve workspace or user cross region inconsistencies @multiregion', () => {
      const mainDb = db
      let region1Db: Knex
      let testUser: BasicTestUser

      before(async () => {
        await truncateTables([Workspaces.name, Users.name])
        region1Db = await getDb({ regionKey: 'region1' })
        testUser = await createTestUser(buildBasicTestUser())

        for (let i = 0; i < 30; i++) {
          await createTestWorkspace(buildBasicTestWorkspace(), testUser)
        }

        for (let i = 0; i < 34; i++) {
          await createTestUser(buildBasicTestUser())
        }

        await region1Db('workspaces').delete()
        await region1Db('users').delete()
      })

      it('does not have any workspaces or users in region1', async () => {
        const workspaces = await region1Db('workspaces').select()
        const users = await region1Db('users').select()

        expect(workspaces.length).to.eq(0)
        expect(users.length).to.eq(0)
      })

      it('backfills all workspaces from region1 so checksums are identical', async () => {
        const copyAllWorkspacesAcrossRegions = copyAllWorkspacesAcrossRegionsFactory({
          getAllWorkspaces: getAllWorkspacesFactory({ db: mainDb }),
          upsertWorkspace: upsertWorkspaceFactory({ db: region1Db })
        })

        await copyAllWorkspacesAcrossRegions({ logger })

        const checksumMain = await getAllWorkspaceChecksumFactory({ db: mainDb })()
        const checksumRegion = await getAllWorkspaceChecksumFactory({ db: region1Db })()
        const workspaces = await region1Db('workspaces').select()
        expect(workspaces.length).to.eq(30)
        expect(checksumMain).to.deep.eq(checksumRegion)
      })

      it('backfills all users from region1 so checksums are identical', async () => {
        const copyAllUsersAcressRegions = copyAllUsersAcrossRegionsFactory({
          getAllUsers: getAllUsersFactory({ db: mainDb }),
          upsertUser: upsertUserFactory({ db: region1Db })
        })

        await copyAllUsersAcressRegions({ logger })

        const checksumMain = await getAllUsersChecksumFactory({ db: mainDb })()
        const checksumRegion = await getAllUsersChecksumFactory({ db: region1Db })()
        const users = await region1Db('users').select()
        expect(users.length).to.eq(35)
        expect(checksumMain).to.deep.eq(checksumRegion)
      })
    })
  : {}
