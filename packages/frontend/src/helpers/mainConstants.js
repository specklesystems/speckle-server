/**
 * Speckle role constants
 */
export const Roles = Object.freeze({
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
 * Keys for values stored in localStorage
 */
export const LocalStorageKeys = Object.freeze({
  AuthToken: 'AuthToken',
  RefreshToken: 'RefreshToken'
})
