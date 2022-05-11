/* istanbul ignore file */
'use strict'

const knex = require('@/db/knex')

const ObjectPreview = () => knex('object_preview')
const Previews = () => knex('previews')

module.exports = {
  async getObjectPreviewInfo({ streamId, objectId }) {
    return await ObjectPreview().select('*').where({ streamId, objectId }).first()
  },

  async createObjectPreview({ streamId, objectId, priority }) {
    const insertionObject = {
      streamId,
      objectId,
      priority,
      previewStatus: 0
    }
    const sqlQuery =
      ObjectPreview().insert(insertionObject).toString() + ' on conflict do nothing'
    await knex.raw(sqlQuery)
  },

  async getPreviewImage({ previewId }) {
    const previewRow = await Previews().where({ id: previewId }).first().select('*')
    if (!previewRow) {
      return null
    }
    return previewRow.data
  }
}
