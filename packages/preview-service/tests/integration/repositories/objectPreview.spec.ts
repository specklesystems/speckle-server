import { describe, it, expect } from 'vitest'
import { getNextUnstartedObjectPreviewFactory } from '../../../repositories/objectPreview'
import cryptoRandomString from 'crypto-random-string'
import { getTestDb } from '../../testKnex'

describe('Repositories: ObjectPreview', () => {
  const db = getTestDb() //FIXME get from global context

  describe('getNextUnstartedObjectPreview', () => {
    it('should return the next unstarted object preview', async () => {
      const ObjectPreview = () => db('object_preview')
      const streamId = cryptoRandomString({ length: 10 })
      const objectId = cryptoRandomString({ length: 10 })
      const insertionObject = {
        streamId,
        objectId,
        priority: 0,
        previewStatus: 0
      }
      const sqlQuery =
        ObjectPreview().insert(insertionObject).toString() + ' on conflict do nothing'
      await db.raw(sqlQuery)

      const getNextUnstartedObjectPreview = getNextUnstartedObjectPreviewFactory({ db })
      const result = await getNextUnstartedObjectPreview()
      expect(result).toBeDefined()
      expect(result.streamId).toEqual(streamId)
      expect(result.objectId).toEqual(objectId)
    })
  })
})
