const _ = require('lodash')

/**
 * Speckle role constants
 */
const Roles = Object.freeze({
  Stream: {
    Owner: 'stream:owner',
    Contributor: 'stream:contributor',
    Reviewer: 'stream:reviewer'
  },
  Server: {
    Admin: 'server:admin',
    User: 'server:user',
    ArchivedUser: 'server:archived-user'
  }
})

/**
 * Speckle scope constants
 */
const Scopes = Object.freeze({
  Streams: {
    Read: 'streams:read',
    Write: 'streams:write'
  },
  Profile: {
    Read: 'profile:read',
    Email: 'profile:email',
    Delete: 'profile:delete'
  },
  Users: {
    Read: 'users:read',
    Email: 'users:email',
    Invite: 'users:invite'
  },
  Server: {
    Stats: 'server:stats',
    Setup: 'server:setup'
  },
  Tokens: {
    Read: 'tokens:read',
    Write: 'tokens:write'
  }
})

/**
 * All scopes
 * @type {string[]}
 */
const AllScopes = _.flatMap(Scopes, (v) => Object.values(v))

module.exports = {
  Roles,
  Scopes,
  AllScopes
}
