import { db } from '@/db/knex'
import { getAllUsersChecksumFactory } from '@/modules/core/repositories/users'
import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { createTestUser } from '@/test/authHelper'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { expect } from 'chai'

describe('users repository', () => {
  describe('the mechanism to detect that user tables have changed @multiregion', () => {
    it('should return the same checksum if all entries have not changed', async () => {
      await createTestUser()
      const getAllUsersChecksum = getAllUsersChecksumFactory({ db })

      const checksum = await getAllUsersChecksum()
      const checksum2 = await getAllUsersChecksum()

      expect(checksum).to.be.a('string')
      expect(checksum).to.be.eql(checksum2)
    })

    it('should have a different result on one update', async () => {
      const getAllUsersChecksum = getAllUsersChecksumFactory({ db })

      const checksum = await getAllUsersChecksum()
      await createTestUser()
      const checksum2 = await getAllUsersChecksum()

      expect(checksum).to.be.a('string')
      expect(checksum).to.not.be.eql(checksum2)
    })

    isMultiRegionTestMode()
      ? it('can check equality in two different regions', async () => {
          await createTestUser()

          const checksum = await getAllUsersChecksumFactory({ db })()
          const region1Db = await getDb({ regionKey: 'region1' })
          const checksum2 = await getAllUsersChecksumFactory({ db: region1Db })()

          expect(checksum).to.be.a('string')
          expect(checksum).to.be.eql(checksum2)
        })
      : {}
  })
})
