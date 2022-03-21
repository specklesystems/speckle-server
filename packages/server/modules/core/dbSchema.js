const knex = require('@/db/knex')

/**
 * Single source of truth for DB schema in the codebase
 */

module.exports = {
  Streams: {
    name: 'streams',
    knex: () => knex('streams'),
    col: {
      id: 'streams.id',
      name: 'streams.name',
      description: 'streams.description',
      isPublic: 'streams.isPublic',
      clonedFrom: 'streams.clonedFrom',
      createdAt: 'streams.createdAt',
      updatedAt: 'streams.updatedAt'
    }
  },
  StreamAcl: {
    name: 'stream_acl',
    knex: () => knex('stream_acl'),
    col: {
      userId: 'stream_acl.userId',
      resourceId: 'stream_acl.resourceId',
      role: 'stream_acl.role'
    }
  },
  StreamFavorites: {
    name: 'stream_favorites',
    knex: () => knex('stream_favorites'),
    col: {
      streamId: 'stream_favorites.streamId',
      userId: 'stream_favorites.userId',
      createdAt: 'stream_favorites.createdAt'
    }
  },
  knex
}
