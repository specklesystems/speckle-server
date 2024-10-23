'use strict'
const { validateScopes, authorizeResolver } = require('@/modules/shared')

const { Roles, Scopes } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')
const { DatabaseError } = require('@/modules/shared/errors')

module.exports = {
  async validatePermissionsWriteStream(streamId, req) {
    if (!req.context || !req.context.auth) {
      req.log.debug('User is not authenticated, so cannot write to stream.')
      return { result: false, status: 401 }
    }

    try {
      await throwForNotHavingServerRole(req.context, Roles.Server.Guest)
    } catch (e) {
      if (e instanceof DatabaseError) return { result: false, status: 500 }
      req.log.info({ err: e }, 'Error while checking server role')
      return { result: false, status: 401 }
    }

    try {
      await validateScopes(req.context.scopes, Scopes.Streams.Write)
    } catch (e) {
      req.log.info({ err: e }, 'Error while checking scopes')
      return { result: false, status: 401 }
    }

    try {
      await authorizeResolver(
        req.context.userId,
        streamId,
        Roles.Stream.Contributor,
        req.context.resourceAccessRules
      )
    } catch (e) {
      if (e instanceof DatabaseError) return { result: false, status: 500 }
      req.log.info({ err: e }, 'Error while checking stream contributor role')
      return { result: false, status: 401 }
    }

    return { result: true, status: 200 }
  }
}
