'use strict'
const knex = require('@/db/knex')
const {
  getServerVersion,
  getServerOrigin,
  getServerMovedTo,
  getServerMovedFrom,
  getMaximumObjectSizeMB,
  getFileSizeLimitMB
} = require('@/modules/shared/helpers/envHelper')

const Roles = () => knex('user_roles')
const Scopes = () => knex('scopes')
const Info = () => knex('server_config')

module.exports = {
  /**
   * @returns {Promise<import('@/modules/core/helpers/types').ServerInfo>}
   */
  async getServerInfo() {
    const serverInfo = await Info().select('*').first()
    serverInfo.version = getServerVersion()
    serverInfo.canonicalUrl = getServerOrigin()
    const movedTo = getServerMovedTo()
    const movedFrom = getServerMovedFrom()
    serverInfo.configuration = {
      objectSizeLimitBytes: getMaximumObjectSizeMB() * 1024 * 1024,
      objectMultipartUploadSizeLimitBytes: getFileSizeLimitMB() * 1024 * 1024
    }
    if (movedTo || movedFrom) serverInfo.migration = { movedTo, movedFrom }
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

  /**
   * @param {Partial<import('@/modules/core/helpers/types').ServerConfigRecord>} param0
   */
  async updateServerInfo({
    name,
    company,
    description,
    adminContact,
    termsOfService,
    inviteOnly,
    guestModeEnabled
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
        guestModeEnabled,
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
        guestModeEnabled,
        completed: true
      })
  }
}
