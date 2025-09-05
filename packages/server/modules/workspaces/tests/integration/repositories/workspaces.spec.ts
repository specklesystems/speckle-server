import { db } from '@/db/knex'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { getAllWorkspaceChecksumFactory } from '@/modules/workspaces/repositories/workspaces'
import { createTestUser, type BasicTestUser } from '@/test/authHelper'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { expect } from 'chai'
import {
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'

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
      ? it('can check equality in two different regions', async () => {
          await createTestWorkspace(buildBasicTestWorkspace(), user)

          const checksum = await getAllWorkspaceChecksumFactory({ db })()
          const region1Db = await getDb({ regionKey: 'region1' })
          const checksum2 = await getAllWorkspaceChecksumFactory({ db: region1Db })()

          expect(checksum).to.be.a('string')
          expect(checksum).to.be.eql(checksum2)
        })
      : {}
  })
})
