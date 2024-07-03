import { databaseIntegrationTest } from '#/helpers/testExtensions.js'
import {
  ObjectPreview,
  getNextUnstartedObjectPreviewFactory
} from '@/repositories/objectPreview.js'
import cryptoRandomString from 'crypto-random-string'
import { describe, expect } from 'vitest'

describe.concurrent('Repositories: ObjectPreview', () => {
  describe.concurrent('getNextUnstartedObjectPreview', () => {
    databaseIntegrationTest(
      'should return the next unstarted object preview',
      async ({ context }) => {
        const streamId = cryptoRandomString({ length: 10 })
        const objectId = cryptoRandomString({ length: 10 })
        const insertionObject = {
          streamId,
          objectId,
          priority: 0,
          previewStatus: 0
        }
        const sqlQuery = ObjectPreview({ db: context.db })
          .insert(insertionObject)
          .onConflict()
          .ignore()
        await context.db.raw(sqlQuery.toQuery())

        const getNextUnstartedObjectPreview = getNextUnstartedObjectPreviewFactory({
          db: context.db
        })
        const result = await getNextUnstartedObjectPreview()
        expect(result).toBeDefined()
        expect(result.streamId).toEqual(streamId)
        expect(result.objectId).toEqual(objectId)
      }
    )
  })
})
