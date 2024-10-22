const knex = require(`@/db/knex`)

const Objects = () => knex('objects')

module.exports = {
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
  },

  async hasObjects({ streamId, objectIds }) {
    const dbRes = await Objects()
      .whereIn('id', objectIds)
      .andWhere('streamId', streamId)
      .select('id')

    const res = {}
    for (const i in objectIds) {
      res[objectIds[i]] = false
    }
    for (const i in dbRes) {
      res[dbRes[i].id] = true
    }
    return res
  }
}
