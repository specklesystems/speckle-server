import {
  UserServerRole,
  UserStreamRole
} from '@/modules/shared/domain/rolesAndScopes/types'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { RoleInfo } from '@speckle/shared'
import { pick } from 'lodash'

// Conventions:
// "weight: 1000" => resource owner
// "weight: 100" => resource viewer / basic user
// Anything in between 100 and 1000 can be used for escalating privileges.
const keysToPick = ['weight', 'description'] as const

const coreUserRoles: Array<UserServerRole | UserStreamRole> = [
  /**
   * Roles for "this" server.
   */
  {
    name: Roles.Server.Admin,
    ...pick(RoleInfo.Server[Roles.Server.Admin], keysToPick),
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    public: false
  },
  {
    name: Roles.Server.User,
    ...pick(RoleInfo.Server[Roles.Server.User], keysToPick),
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    public: false
  },
  // TODO: should this be dynamically pushed if guest role is enabled?
  // feels risky, since feature can be toggled on and off,
  // but user roles are not updated
  // can leave the guest users in a broken state
  {
    name: Roles.Server.Guest,
    ...pick(RoleInfo.Server[Roles.Server.Guest], keysToPick),
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    public: false
  },
  {
    name: Roles.Server.ArchivedUser,
    ...pick(RoleInfo.Server[Roles.Server.ArchivedUser], keysToPick),
    resourceTarget: 'server',
    aclTableName: 'server_acl',
    public: false
  },
  /**
   * Roles for streams.
   */
  {
    name: Roles.Stream.Owner,
    ...pick(RoleInfo.Stream[Roles.Stream.Owner], keysToPick),
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    public: true
  },
  {
    name: Roles.Stream.Contributor,
    ...pick(RoleInfo.Stream[Roles.Stream.Owner], keysToPick),
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    public: true
  },
  {
    name: Roles.Stream.Reviewer,
    ...pick(RoleInfo.Stream[Roles.Stream.Owner], keysToPick),
    resourceTarget: 'streams',
    aclTableName: 'stream_acl',
    public: true
  }
]

export default coreUserRoles
