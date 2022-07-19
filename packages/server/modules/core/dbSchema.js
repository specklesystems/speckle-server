const knex = require('@/db/knex')

/**
 * Single source of truth for DB schema in the codebase
 */

/**
 * TODO:
 * ServerInvites:
 *  - Get rid of the 'used' field, it's not used anymore
 *
 * TODO: Redo this when we have TS support with nice typing, ability to get columns with/without aliases
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
      createdAt: 'stream_favorites.createdAt',
      cursor: 'stream_favorites.cursor'
    }
  },
  Users: {
    name: 'users',
    knex: () => knex('users'),
    col: {
      id: 'users.id',
      suuid: 'users.suuid',
      createdAt: 'users.createdAt',
      name: 'users.name',
      bio: 'users.bio',
      company: 'users.company',
      email: 'users.email',
      verified: 'users.verified',
      avatar: 'users.avatar',
      profiles: 'users.profiles',
      passwordDigest: 'users.passwordDigest',
      ip: 'users.ip'
    }
  },
  ServerAcl: {
    name: 'server_acl',
    knex: () => knex('server_acl'),
    col: {
      userId: 'server_acl.userId',
      role: 'server_acl.role'
    }
  },
  Comments: {
    name: 'comments',
    knex: () => knex('comments'),
    col: {
      id: 'comments.id',
      streamId: 'comments.streamId',
      authorId: 'comments.authorId',
      createdAt: 'comments.createdAt',
      updatedAt: 'comments.updatedAt',
      text: 'comments.text',
      screenshot: 'comments.screenshot',
      data: 'comments.data',
      archived: 'comments.archived',
      parentComment: 'comments.parentComment'
    }
  },
  ServerInvites: {
    name: 'server_invites',
    knex: () => knex('server_invites'),
    col: {
      id: 'server_invites.id',
      target: 'server_invites.target',
      inviterId: 'server_invites.inviterId',
      createdAt: 'server_invites.createdAt',
      used: 'server_invites.used',
      message: 'server_invites.message',
      resourceTarget: 'server_invites.resourceTarget',
      resourceId: 'server_invites.resourceId',
      role: 'server_invites.role'
    }
  },
  knex
}
