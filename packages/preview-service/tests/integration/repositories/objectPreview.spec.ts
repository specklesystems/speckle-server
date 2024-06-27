import { describe, it } from 'vitest'
import { newDb } from 'pg-mem'
import type { Knex } from 'knex'
// import { getNextUnstartedObjectPreviewFactory } from 'repositories/objectPreview'
import cryptoRandomString from 'crypto-random-string'

describe('Repositories: ObjectPreview', () => {
  describe('getNextUnstartedObjectPreview', () => {
    it('should return the next unstarted object preview', async () => {
      // test implementation
      const pgMem = newDb()

      const db = (await pgMem.adapters.createKnex()) as Knex

      await db.schema.createTable('object_preview', (table) => {
        table.string('streamId', 10) //ignoring fk on streams table for simplicity
        table.string('objectId').notNullable()
        table.integer('previewStatus').notNullable().defaultTo(0)
        table.integer('priority').notNullable().defaultTo(1)
        table.timestamp('lastUpdate').notNullable().defaultTo(db.fn.now())
        table.jsonb('preview')
        table.primary(['streamId', 'objectId'])
        table.index(['previewStatus', 'priority', 'lastUpdate'])
      })

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
      console.log(
        await db.raw(`UPDATE object_preview
                      SET
                        "previewStatus" = 1,
                        "lastUpdate" = NOW()
                      FROM (
                        SELECT "streamId", "objectId" FROM object_preview
                        WHERE "previewStatus" = 0 OR ("previewStatus" = 1 AND "lastUpdate" < NOW() - INTERVAL '7 DAYS')
                        ORDER BY "priority" ASC, "lastUpdate" ASC
                        LIMIT 1
                      ) as task
                      WHERE object_preview."streamId" = task."streamId" AND object_preview."objectId" = task."objectId"
                      RETURNING task."streamId", task."objectId"`)
      )

      // const getNextUnstartedObjectPreview = getNextUnstartedObjectPreviewFactory({ db })
      // const result = await getNextUnstartedObjectPreview()
      // expect(result).toBeDefined()
      // expect(result.streamId).toEqual(streamId)
      // expect(result.objectId).toEqual(objectId)
    })
  })
})
