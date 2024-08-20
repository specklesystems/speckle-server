'use strict'
const { validateScopes, authorizeResolver } = require('@/modules/shared')

const { getStream } = require('../services/streams')
const { Roles, Scopes } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')

module.exports = {
  async validatePermissionsReadStream(streamId, req) {
    const stream = await getStream({ streamId, userId: req.context.userId })
    if (stream?.isPublic) return { result: true, status: 200 }

    try {
      await throwForNotHavingServerRole(req.context, Roles.Server.Guest)
    } catch (err) {
      req.log.debug(
        { err },
        'User does not have the required server role to read stream.'
      )
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
      } catch (err) {
        req.log.debug(
          { err },
          'User does not have the required server role to read from public stream.'
        )
        return { result: false, status: 401 }
      }

      try {
        await authorizeResolver(
          req.context.userId,
          streamId,
          Roles.Stream.Reviewer,
          req.context.resourceAccessRules
        )
      } catch (err) {
        req.log.debug(
          { err },
          'User does not have the required stream role to read from stream.'
        )
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
    } catch (err) {
      req.log.debug(
        { err },
        'User does not have the required server role to write to stream.'
      )
      return { result: false, status: 401 }
    }

    try {
      await validateScopes(req.context.scopes, Scopes.Streams.Write)
    } catch (err) {
      req.log.debug(
        { err },
        'User does not have the required scopes to write to stream.'
      )
      return { result: false, status: 401 }
    }

    try {
      await authorizeResolver(
        req.context.userId,
        streamId,
        Roles.Stream.Contributor,
        req.context.resourceAccessRules
      )
    } catch (err) {
      req.log.debug({ err }, 'User does not have the required stream role to write.')
      return { result: false, status: 401 }
    }

    return { result: true, status: 200 }
  }
}
