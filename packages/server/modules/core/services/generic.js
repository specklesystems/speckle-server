const knex = require('@/db/knex')

const Roles = () => knex('user_roles')
const Scopes = () => knex('scopes')

module.exports = {
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
  }
}
