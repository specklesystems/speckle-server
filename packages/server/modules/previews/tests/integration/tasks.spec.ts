import { db } from '@/db/knex'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'
import {
  getPaginatedObjectPreviewsPageFactory,
  getPaginatedObjectPreviewsTotalCountFactory,
  storeObjectPreviewFactory,
  updateObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import { PreviewPriority, PreviewStatus } from '@/modules/previews/domain/consts'
import cryptoRandomString from 'crypto-random-string'
import { getPaginatedObjectPreviewInErrorStateFactory } from '@/modules/previews/services/tasks'

describe('Previews services @previews', () => {
  const storeObjectPreview = storeObjectPreviewFactory({ db })
  const updateObjectPreview = updateObjectPreviewFactory({ db })

  describe('getPaginatedObjectPreviewInErrorStateFactory returns a function that, ', async () => {
    const SUT = getPaginatedObjectPreviewInErrorStateFactory({
      getPaginatedObjectPreviewsPage: getPaginatedObjectPreviewsPageFactory({ db }),
      getPaginatedObjectPreviewsTotalCount: getPaginatedObjectPreviewsTotalCountFactory(
        { db }
      )
    })
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

    it('retrieves only object previews in an error state ordered by number of attempts then last updated', async () => {
      const testObjects = [
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.MEDIUM,
          incrementAttempts: true
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.MEDIUM
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.LOW,
          incrementAttempts: true
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.LOW
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.HIGH,
          incrementAttempts: true
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.HIGH
        }
      ]

      await Promise.all(testObjects.map(async (obj) => await storeObjectPreview(obj)))

      await Promise.all(
        testObjects.map(
          async (obj) =>
            await updateObjectPreview({
              objectPreview: {
                objectId: obj.objectId,
                streamId: obj.streamId,
                previewStatus: PreviewStatus.ERROR,
                incrementAttempts: obj.incrementAttempts ?? false
              }
            })
        )
      )

      const results = await SUT({
        limit: 400,
        cursor: null
      })
      expect(results.items).to.have.lengthOf(6)
      expect(results.totalCount).to.equal(6)
      expect(results.items[0].priority).to.equal(PreviewPriority.HIGH)
      expect(results.items[0].attempts).to.equal(1) //FIXME this is not what we want, but we have to sort all columns the same way
      expect(results.items[1].priority).to.equal(PreviewPriority.HIGH)
      expect(results.items[1].attempts).to.equal(0)
      expect(results.items[2].priority).to.equal(PreviewPriority.MEDIUM)
      expect(results.items[2].attempts).to.equal(1)
      expect(results.items[3].priority).to.equal(PreviewPriority.MEDIUM)
      expect(results.items[3].attempts).to.equal(0)
      expect(results.items[4].priority).to.equal(PreviewPriority.LOW)
      expect(results.items[4].attempts).to.equal(1)
      expect(results.items[5].priority).to.equal(PreviewPriority.LOW)
      expect(results.items[5].attempts).to.equal(0)
    })
  })
})
