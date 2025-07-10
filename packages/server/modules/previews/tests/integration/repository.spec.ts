import { db } from '@/db/knex'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import {
  getObjectPreviewInfoFactory,
  storeObjectPreviewFactory,
  updateObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import { PreviewPriority, PreviewStatus } from '@/modules/previews/domain/consts'
import cryptoRandomString from 'crypto-random-string'

describe('Previews repositories @previews', () => {
  const storeObjectPreview = storeObjectPreviewFactory({ db })

  describe('updateObjectPreviewFactory returns a function that, ', () => {
    const SUT = updateObjectPreviewFactory({ db })
    let user: Awaited<ReturnType<typeof createTestUser>>
    let stream: Awaited<ReturnType<typeof createTestStream>>

    before(async () => {
      user = await createTestUser({
        name: cryptoRandomString({ length: 10 }),
        email: createRandomEmail()
      })
      stream = await createTestStream(
        {
          ownerId: user.id,
          name: cryptoRandomString({ length: 10 })
        },
        user
      )
    })

    it('increments the number of attempts by 1 when requested', async () => {
      const originalObject = {
        streamId: stream.id!,
        objectId: cryptoRandomString({ length: 10 }),
        priority: PreviewPriority.MEDIUM
      }

      await storeObjectPreview(originalObject)

      const storedOriginal = await getObjectPreviewInfoFactory({ db })({
        ...originalObject
      })
      expect(storedOriginal?.attempts).to.equal(0)

      const results = await SUT({
        objectPreview: { ...originalObject, incrementAttempts: true }
      })
      expect(results).to.have.lengthOf(1)
      expect(results[0].attempts).to.equal(1)
      expect(results[0].previewStatus).to.equal(PreviewStatus.PENDING)
      expect(results[0].priority).to.equal(PreviewPriority.MEDIUM)
    })
    it('does not increment the number of attempts when not requested to', async () => {
      const originalObject = {
        streamId: stream.id!,
        objectId: cryptoRandomString({ length: 10 }),
        priority: PreviewPriority.MEDIUM
      }

      await storeObjectPreview(originalObject)

      const storedOriginal = await getObjectPreviewInfoFactory({ db })({
        ...originalObject
      })
      expect(storedOriginal?.attempts).to.equal(0)

      const results = await SUT({
        objectPreview: { ...originalObject, incrementAttempts: false }
      })
      expect(results).to.have.lengthOf(1)
      expect(results[0].attempts).to.equal(0)
      expect(results[0].previewStatus).to.equal(PreviewStatus.PENDING)
      expect(results[0].priority).to.equal(PreviewPriority.MEDIUM)
    })
  })
})
