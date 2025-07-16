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
import { getPaginatedObjectPreviewInErrorStateFactory } from '@/modules/previews/services/retryErrors'
import { wait } from '@speckle/shared'

describe('Previews services @previews', () => {
  const storeObjectPreview = storeObjectPreviewFactory({ db })
  const updateObjectPreview = updateObjectPreviewFactory({ db })

  describe('getPaginatedObjectPreviewInErrorStateFactory returns a function that, ', () => {
    const SUT = getPaginatedObjectPreviewInErrorStateFactory({
      getPaginatedObjectPreviewsPage: getPaginatedObjectPreviewsPageFactory({ db }),
      getPaginatedObjectPreviewsTotalCount: getPaginatedObjectPreviewsTotalCountFactory(
        { db }
      ),
      maximumNumberOfAttempts: 2
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

    it('retrieves only object previews in an error state ordered by last updated', async () => {
      const testObjects = [
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.MEDIUM,
          status: PreviewStatus.DONE // This one should not be returned
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.MEDIUM
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.MEDIUM
        },
        {
          streamId: stream.id!,
          objectId: cryptoRandomString({ length: 10 }),
          priority: PreviewPriority.MEDIUM
        }
      ]

      await Promise.all(testObjects.map(async (obj) => await storeObjectPreview(obj)))

      await Promise.all(
        testObjects.map(async (obj) => {
          await wait(Math.random() * 100) // Make the lastUpdate value different for each object preview
          await updateObjectPreview({
            objectPreview: {
              objectId: obj.objectId,
              streamId: obj.streamId,
              previewStatus: obj.status ?? PreviewStatus.ERROR,
              incrementAttempts: false
            }
          })
        })
      )

      const results = await SUT({
        limit: 100,
        cursor: null
      })
      expect(results.items, JSON.stringify(results.items)).to.have.lengthOf(3)
      expect(results.totalCount).to.equal(3)

      const originalFirstItem = { ...results.items[0] }

      // We're going to update the first item
      await updateObjectPreview({
        objectPreview: {
          objectId: originalFirstItem.objectId,
          streamId: originalFirstItem.streamId,
          previewStatus: PreviewStatus.ERROR,
          incrementAttempts: true
        }
      })

      // re-run the query
      const nextResults = await SUT({
        limit: 100,
        cursor: null
      })

      // We should have a different first item
      expect(
        nextResults.items,
        JSON.stringify(nextResults.items, null, 2)
      ).to.have.lengthOf(3)
      expect(nextResults.totalCount).to.equal(3)
      expect(nextResults.items[0].objectId).to.not.equal(originalFirstItem.objectId)

      // the last item, because it is still errored, should be the one we just updated and have a new lastUpdate date
      expect(nextResults.items[2].objectId).to.equal(originalFirstItem.objectId)
      expect(nextResults.items[2].lastUpdate).to.be.greaterThan(
        originalFirstItem.lastUpdate
      )
      expect(nextResults.items[2].attempts).to.equal(1)

      // We're going to again update that original first item
      await updateObjectPreview({
        objectPreview: {
          objectId: originalFirstItem.objectId,
          streamId: originalFirstItem.streamId,
          previewStatus: PreviewStatus.ERROR,
          incrementAttempts: true // this should put it over the maximum number of attempts
        }
      })

      // re-run the query
      const maxAttemptsResults = await SUT({
        limit: 100,
        cursor: null
      })

      // The original first item should not be in the results anymore
      expect(
        maxAttemptsResults.items,
        JSON.stringify(maxAttemptsResults.items, null, 2)
      ).to.have.lengthOf(2)
      expect(maxAttemptsResults.totalCount).to.equal(2)
      expect(maxAttemptsResults.items.map((item) => item.objectId)).to.not.contain(
        originalFirstItem.objectId
      )
    })
  })
})
