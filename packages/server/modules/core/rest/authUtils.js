'use strict'
const { validateScopes, authorizeResolver } = require('@/modules/shared')

const { Roles, Scopes } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')
const { DatabaseError } = require('@/modules/shared/errors')
const { getStreamFactory } = require('@/modules/core/repositories/streams')
const { db } = require('@/db/knex')

module.exports = {
  async validatePermissionsReadStream(streamId, req) {
    const getStream = getStreamFactory({ db })
    const stream = await getStream({ streamId, userId: req.context.userId })
    if (stream?.isPublic) return { result: true, status: 200 }

    try {
      await throwForNotHavingServerRole(req.context, Roles.Server.Guest)
    } catch (e) {
      if (e instanceof DatabaseError) return { result: false, status: 500 }
      req.log.info({ err: e }, 'Error while checking stream contributor role')
      return { result: false, status: 401 }
    }

    if (!stream) return { result: false, status: 404 }

    if (!stream.isPublic && req.context.auth === false) {
      req.log.debug('User is not authenticated, so cannot read from non-public stream.')
      return { result: false, status: 401 }
    }

    if (!stream.isPublic) {
      try {
        await validateScopes(req.context.scopes, Scopes.Streams.Read)
      } catch (e) {
        req.log.info({ err: e }, 'Error while validating scopes')
        return { result: false, status: 401 }
      }

      try {
        await authorizeResolver(
          req.context.userId,
          streamId,
          Roles.Stream.Reviewer,
          req.context.resourceAccessRules
        )
      } catch (e) {
        if (e instanceof DatabaseError) return { result: false, status: 500 }
        req.log.info({ err: e }, 'Error while checking stream contributor role')
        return { result: false, status: 401 }
      }
    }
    return { result: true, status: 200 }
  },

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
