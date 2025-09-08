import { db, mainDb } from '@/db/knex'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import {
  getAllWorkspaceChecksumFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import { createTestUser, type BasicTestUser } from '@/test/authHelper'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { expect } from 'chai'
import {
  buildBasicTestWorkspace,
  buildTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { truncateTables } from '@/test/hooks'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'

describe('workspaces repository', () => {
  describe('the mechanism to detect that workspace tables have changed @multiregion', () => {
    let user: BasicTestUser

    before(async () => {
      user = await createTestUser()
    })

    it('should return the same checksum if all entries have not changed', async () => {
      await createTestWorkspace(buildBasicTestWorkspace(), user)
      const getAllWorkspaceChecksum = getAllWorkspaceChecksumFactory({ db })

      const checksum = await getAllWorkspaceChecksum()
      const checksum2 = await getAllWorkspaceChecksum()

      expect(checksum).to.be.a('string')
      expect(checksum).to.be.eql(checksum2)
    })

    it('should have a different result on one update', async () => {
      const getAllWorkspaceChecksum = getAllWorkspaceChecksumFactory({ db })

      const checksum = await getAllWorkspaceChecksum()
      await createTestWorkspace(buildBasicTestWorkspace(), user)
      const checksum2 = await getAllWorkspaceChecksum()

      expect(checksum).to.be.a('string')
      expect(checksum).to.not.be.eql(checksum2)
    })

    isMultiRegionTestMode()
      ? describe('workspace checksum ', () => {
          before(async () => {
            await truncateTables([Workspaces.name])
          })

          it('can check equality in two different regions', async () => {
            const region1Db = await getDb({ regionKey: 'region1' })

            for (let i = 0; i < 50; i++) {
              const workspace = buildTestWorkspace()
              await upsertWorkspaceFactory({ db: mainDb })({ workspace })
              await upsertWorkspaceFactory({ db: region1Db })({ workspace })
            }

            const checksum = await getAllWorkspaceChecksumFactory({ db })()
            const checksum2 = await getAllWorkspaceChecksumFactory({ db: region1Db })()

            expect(checksum).to.be.a('string')
            expect(checksum).to.be.eql(checksum2)
          })
        })
      : {}
  })
})
