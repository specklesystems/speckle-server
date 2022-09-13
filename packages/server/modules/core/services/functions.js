'use strict'

const knex = require('@/db/knex')
const crs = require('crypto-random-string')

const Functions = () => knex('functions')

module.exports = {
  async getFunctions({ streamId }) {
    const aaa = await Functions()

    const functions = (
      await Functions().where({
        streamId
      })
    ).map((o) => o.url)

    return functions
  },
  async addFunction({ url, streamId }) {
    await Functions().insert({
      id: crs({ length: 10 }),
      streamId,
      url
    })
  }
}
