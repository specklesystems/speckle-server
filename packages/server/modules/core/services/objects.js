const knex = require(`@/db/knex`)

const Objects = () => knex('objects')

module.exports = {
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
