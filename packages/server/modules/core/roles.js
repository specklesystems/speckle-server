'use strict'
const { Roles } = require('@/modules/core/helpers/mainConstants')

// Conventions:
// "weight: 1000" => resource owner
// "weight: 100" => resource viewer / basic user
// Anything in between 100 and 1000 can be used for escalating privileges.

module.exports = [
  /**
   * Roles for "this" server.
   */
  {
    name: Roles.Server.Admin,
    description:
      'Holds supreme autocratic authority, not restricted by written laws, legislature, or customs.',
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    weight: 1000,
    public: false
  },
  {
    name: Roles.Server.User,
    description: 'Has normal access to the server.',
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    weight: 100,
    public: false
  },
  {
    name: Roles.Server.ArchivedUser,
    description: 'No longer has access to the server.',
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    weight: 10,
    public: false
  },
  /**
   * Roles for streams.
   */
  {
    name: Roles.Stream.Owner,
    description: 'Owners have full access, including deletion rights & access control.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 1000,
    public: true
  },
  {
    name: Roles.Stream.Contributor,
    description:
      'Contributors can create new branches and commits, but they cannot edit stream details or manage collaborators.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 500,
    public: true
  },
  {
    name: Roles.Stream.Reviewer,
    description: 'Reviewers can only view (read) the data from this stream.',
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    weight: 100,
    public: true
  }
]
