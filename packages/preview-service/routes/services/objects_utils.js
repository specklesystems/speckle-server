'use strict'

const knex = require('../../knex')

const Objects = () => knex('objects')

module.exports = {
  async getObject({ streamId, objectId }) {
    const res = await Objects().where({ streamId, id: objectId }).select('*').first()
    if (!res) return null
    res.data.totalChildrenCount = res.totalChildrenCount
    delete res.streamId
    return res
  },

  // NOTE: Copy pasted from server > modules/core/services/objects.js
  async getObjectChildrenStream({ streamId, objectId }) {
    const q = knex.with(
      'object_children_closure',
      knex.raw(
        `SELECT objects.id as parent, d.key as child, d.value as mindepth, ? as "streamId"
        FROM objects
        JOIN jsonb_each_text(objects.data->'__closure') d ON true
        where objects.id = ?`,
        [streamId, objectId]
      )
    )
    q.select('id')
    q.select(knex.raw('data::text as "dataText"'))
    q.from('object_children_closure')

    q.rightJoin('objects', function () {
      this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
        'objects.id',
        '=',
        'object_children_closure.child'
      )
    })
      .where(
        knex.raw('object_children_closure."streamId" = ? AND parent = ?', [
          streamId,
          objectId
        ])
      )
      .orderBy('objects.id')
    return q.stream({ highWaterMark: 500 })
  },

  async getObjectsStream({ streamId, objectIds }) {
    const res = Objects()
      .whereIn('id', objectIds)
      .andWhere('streamId', streamId)
      .orderBy('id')
      .select(
        knex.raw(
          '"id", "speckleType", "totalChildrenCount", "totalChildrenCountByDepth", "createdAt", data::text as "dataText"'
        )
      )
    return res.stream({ highWaterMark: 500 })
  }
}
