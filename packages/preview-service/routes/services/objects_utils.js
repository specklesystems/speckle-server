'use strict'

let debug = require('debug')('speckle:services')
const knex = require('../../knex')

const Objects = () => knex('objects')
const Closures = () => knex('object_children_closure')

module.exports = {
  async getObject({ streamId, objectId }) {
    let res = await Objects().where({ streamId: streamId, id: objectId }).select('*').first()
    if (!res) return null
    res.data.totalChildrenCount = res.totalChildrenCount
    delete res.streamId
    return res
  },

  async getObjectChildrenStream({ streamId, objectId }) {
    let q = Closures()
    q.select('id')
    q.select(knex.raw('data::text as "dataText"'))
    q.rightJoin('objects', function () {
      this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
        'objects.id',
        '=',
        'object_children_closure.child'
      )
    })
      .where(
        knex.raw('object_children_closure."streamId" = ? AND parent = ?', [streamId, objectId])
      )
      .orderBy('objects.id')
    return q.stream({ highWaterMark: 500 })
  },

  async getObjectsStream({ streamId, objectIds }) {
    let res = Objects()
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
