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
  copyAllProjectsAcrossRegionsFactory,
  copyAllUsersAcrossRegionsFactory,
  copyAllWorkspacesAcrossRegionsFactory
} from '@/modules/multiregion/tasks/regionSync'
import {
  bulkUpsertWorkspacesFactory,
  getAllWorkspaceChecksumFactory,
  getAllWorkspacesFactory
} from '@/modules/workspaces/repositories/workspaces'
import type { Knex } from 'knex'
import { logger } from '@/observability/logging'
import {
  bulkUpsertUsersFactory,
  getAllUsersChecksumFactory,
  getAllUsersFactory
} from '@/modules/core/repositories/users'
import { truncateTables } from '@/test/hooks'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import { Streams, Users } from '@/modules/core/dbSchema'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { buildTestProject } from '@/modules/core/tests/helpers/creation'
import {
  bulkUpsertProjectsFactory,
  getAllProjectsChecksumFactory,
  getAllProjectsFactory
} from '@/modules/core/repositories/projects'

isMultiRegionTestMode()
  ? describe('Testing mechanism to solve workspace or user cross region inconsistencies @multiregion', () => {
      const mainDb = db
      let region1Db: Knex
      let region2Db: Knex
      let testUser: BasicTestUser

      before(async () => {
        await truncateTables([Workspaces.name, Users.name, Streams.name])
        region1Db = await getDb({ regionKey: 'region1' })
        region2Db = await getDb({ regionKey: 'region2' })
        testUser = await createTestUser(buildBasicTestUser())

        for (let i = 0; i < 30; i++) {
          await createTestWorkspace(buildBasicTestWorkspace(), testUser)
        }

        for (let i = 0; i < 34; i++) {
          await createTestUser(buildBasicTestUser())
        }

        // no workspaces or users in the target region
        await region1Db('workspaces').delete()
        await region1Db('users').delete()

        const workspaces = await region1Db('workspaces').select()
        const users = await region1Db('users').select()

        expect(workspaces.length).to.eq(0)
        expect(users.length).to.eq(0)
      })

      it('backfills all workspaces from region1 so checksums are identical', async () => {
        const copyAllWorkspacesAcrossRegions = copyAllWorkspacesAcrossRegionsFactory({
          getAllWorkspaces: getAllWorkspacesFactory({ db: mainDb }),
          bulkUpsertWorkspaces: bulkUpsertWorkspacesFactory({ db: region1Db })
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
          bulkUpsertUsers: bulkUpsertUsersFactory({ db: region1Db })
        })

        await copyAllUsersAcressRegions({ logger })

        const checksumMain = await getAllUsersChecksumFactory({ db: mainDb })()
        const checksumRegion = await getAllUsersChecksumFactory({ db: region1Db })()
        const users = await region1Db('users').select()
        expect(users.length).to.eq(35)
        expect(checksumMain).to.deep.eq(checksumRegion)
      })

      it('does not backfill projects that are not targeted ', async () => {
        await copyAllProjectsAcrossRegionsFactory({
          getAllProjects: getAllProjectsFactory({ db: region1Db }),
          bulkUpsertProjects: bulkUpsertProjectsFactory({ db: mainDb })
        })({ logger, regionKey: 'region2' }) // selecting only region2 keys

        const projects = await mainDb('streams').select()

        expect(projects.length).to.eq(0)
      })

      describe('how projects are backfilled', () => {
        before(async () => {
          const user = await createTestUser()

          for (let i = 0; i < 20; i++) {
            await createTestStream(
              buildTestProject({
                regionKey: 'region1',
                workspaceId: null
              }),
              user
            )
          }

          for (let i = 0; i < 20; i++) {
            await createTestStream(
              buildTestProject({
                regionKey: 'region2',
                workspaceId: null
              }),
              user
            )
          }

          await mainDb('streams').delete()

          // no projects in main but only in region1 and region2
          const projects = await mainDb('streams').select()
          expect(projects.length).to.eq(0)
        })

        it('backfills all projects from region1 and region2 so checksums are identical', async () => {
          // region 1 -> main
          await copyAllProjectsAcrossRegionsFactory({
            getAllProjects: getAllProjectsFactory({ db: region1Db }),
            bulkUpsertProjects: bulkUpsertProjectsFactory({ db: mainDb })
          })({ logger, regionKey: 'region1' })

          // region 2 -> main
          await copyAllProjectsAcrossRegionsFactory({
            getAllProjects: getAllProjectsFactory({ db: region2Db }),
            bulkUpsertProjects: bulkUpsertProjectsFactory({ db: mainDb })
          })({ logger, regionKey: 'region2' })

          const mainDbregion1Checksum = await getAllProjectsChecksumFactory({
            db: mainDb
          })({
            regionKey: 'region1'
          })
          const mainDbregion2Checksum = await getAllProjectsChecksumFactory({
            db: mainDb
          })({
            regionKey: 'region2'
          })

          const checksumRegion1 = await getAllProjectsChecksumFactory({
            db: region1Db
          })({
            regionKey: 'region1'
          })
          const checksumRegion2 = await getAllProjectsChecksumFactory({
            db: region2Db
          })({
            regionKey: 'region2'
          })
          // check by counts and checksums
          const projects = await mainDb('streams').select()
          expect(projects.length).to.eq(20 + 20)
          expect(checksumRegion1).to.deep.eq(mainDbregion1Checksum)
          expect(checksumRegion2).to.deep.eq(mainDbregion2Checksum)
          expect(checksumRegion1).not.to.eq(checksumRegion2)
        })
      })
    })
  : {}
