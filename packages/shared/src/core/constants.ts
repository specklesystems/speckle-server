import _ from 'lodash'

/**
 * Speckle role constants
 * - Stream - user roles in the context of a specific stream
 * - Server - user roles in the context of the entire server
 */
export const Roles = Object.freeze(<const>{
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

export type ServerRoles = typeof Roles['Server'][keyof typeof Roles['Server']]
export type StreamRoles = typeof Roles['Stream'][keyof typeof Roles['Stream']]

/**
 * Speckle scope constants
 * - Scopes define what kind of access has a user approved for a specific access token
 */
export const Scopes = Object.freeze(<const>{
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
 */
export const AllScopes = _.flatMap(Scopes, (v) => Object.values(v))
