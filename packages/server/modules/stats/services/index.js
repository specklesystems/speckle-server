'use strict'
const knex = require('@/db/knex')

module.exports = {
  async getTotalStreamCount() {
    const query = 'SELECT COUNT(*) FROM streams'
    const result = await knex.raw(query)
    return parseInt(result.rows[0].count)
  },

  async getTotalCommitCount() {
    const query = 'SELECT COUNT(*) FROM commits'
    const result = await knex.raw(query)
    return parseInt(result.rows[0].count)
  },

  async getTotalObjectCount() {
    const query = 'SELECT COUNT(*) FROM objects'
    const result = await knex.raw(query)
    return parseInt(result.rows[0].count)
  },

  async getTotalUserCount() {
    const query = 'SELECT COUNT(*) FROM users'
    const result = await knex.raw(query)
    return parseInt(result.rows[0].count)
  },

  async getStreamHistory() {
    const query = `
    SELECT
      DATE_TRUNC('month', streams. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      streams
    GROUP BY
      DATE_TRUNC('month', streams. "createdAt")
    `

    const result = await knex.raw(query)
    result.rows.forEach((row) => (row.count = parseInt(row.count)))
    return result.rows
  },

  async getCommitHistory() {
    const query = `
    SELECT
      DATE_TRUNC('month', commits. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      commits
    GROUP BY
      DATE_TRUNC('month', commits. "createdAt")
    `
    const result = await knex.raw(query)
    result.rows.forEach((row) => (row.count = parseInt(row.count)))
    return result.rows
  },

  async getObjectHistory() {
    const query = `
    SELECT
      DATE_TRUNC('month', objects. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      objects
    GROUP BY
      DATE_TRUNC('month', objects. "createdAt")
    `
    const result = await knex.raw(query)
    result.rows.forEach((row) => (row.count = parseInt(row.count)))
    return result.rows
  },

  async getUserHistory() {
    const query = `
    SELECT
      DATE_TRUNC('month', users. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      users
    GROUP BY
      DATE_TRUNC('month', users. "createdAt")
    `
    const result = await knex.raw(query)
    result.rows.forEach((row) => (row.count = parseInt(row.count)))
    return result.rows
  }
}
