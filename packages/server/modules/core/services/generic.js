'use strict'
const knex = require('@/db/knex')

const Roles = () => knex('user_roles')
const Scopes = () => knex('scopes')
const Info = () => knex('server_config')

module.exports = {
  async getServerInfo() {
    const serverInfo = await Info().select('*').first()
    serverInfo.version = process.env.SPECKLE_SERVER_VERSION || 'dev'
    return serverInfo
  },

  async getAllScopes() {
    return await Scopes().select('*')
  },

  async getPublicScopes() {
    return await Scopes().select('*').where({ public: true })
  },

  async getAllRoles() {
    return await Roles().select('*')
  },

  async getPublicRoles() {
    return await Roles().select('*').where({ public: true })
  },

  async updateServerInfo({
    name,
    company,
    description,
    adminContact,
    termsOfService,
    inviteOnly
  }) {
    const serverInfo = await Info().select('*').first()
    if (!serverInfo)
      return await Info().insert({
        name,
        company,
        description,
        adminContact,
        termsOfService,
        inviteOnly,
        completed: true
      })
    else
      return await Info().where({ id: 0 }).update({
        name,
        company,
        description,
        adminContact,
        termsOfService,
        inviteOnly,
        completed: true
      })
  }
}
