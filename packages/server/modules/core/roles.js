'use strict'

module.exports = [
  /**
   * Roles for "this" server.
   */
  {
    name: 'server:admin',
    description: 'Holds supreme autocratic authority, not restricted by written laws, legislature, or customs.',
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    weight: 1000
  },
  {
    name: 'server:user',
    description: 'Has normal access to the server.',
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    weight: 100
  },
  /**
   * Roles for streams.
   */
  {
    name: 'stream:owner',
    description: 'Owners have full access, including deletion rights & access control.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 1000
  }, {
    name: 'stream:contributor',
    description: 'Contributors can create new branches and commits, but they cannot edit stream details or manage collaborators.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 500
  }, {
    name: 'stream:reviewer',
    description: 'Reviewers can only view (read) the data from this stream.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 100
  }
]
