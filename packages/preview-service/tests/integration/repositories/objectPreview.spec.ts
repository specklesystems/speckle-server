import { getTestDb } from '#/testKnex.js'
import {
  ObjectPreview,
  getNextUnstartedObjectPreviewFactory
} from '@/repositories/objectPreview.js'
import cryptoRandomString from 'crypto-random-string'
import { describe, expect, it } from 'vitest'

describe('Repositories: ObjectPreview', () => {
  const db = getTestDb() //FIXME get from global context

  describe('getNextUnstartedObjectPreview', () => {
    it('should return the next unstarted object preview', async () => {
      const streamId = cryptoRandomString({ length: 10 })
      const objectId = cryptoRandomString({ length: 10 })
      const insertionObject = {
        streamId,
        objectId,
        priority: 0,
        previewStatus: 0
      }
      const sqlQuery = ObjectPreview({ db })
        .insert(insertionObject)
        .onConflict()
        .ignore()
      await db.raw(sqlQuery)

      const getNextUnstartedObjectPreview = getNextUnstartedObjectPreviewFactory({ db })
      const result = await getNextUnstartedObjectPreview()
      expect(result).toBeDefined()
      expect(result.streamId).toEqual(streamId)
      expect(result.objectId).toEqual(objectId)
    })
  })
})
